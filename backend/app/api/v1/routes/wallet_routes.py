import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user, get_session
from app.core.config import get_settings
from app.integrations.razorpay_client import (
    create_order as razorpay_create_order,
    fetch_payment as razorpay_fetch_payment,
    verify_payment_signature,
)
from app.models.gold import Transaction, TxnType
from app.models.user import User
from app.repositories import gold_repo, user_repo
from app.schemas.wallet_schema import (
    DepositIn,
    RazorpayOrderIn,
    RazorpayOrderOut,
    RazorpayVerifyIn,
    TransactionOut,
    WalletOut,
    WithdrawIn,
)
from app.services.referral_service import credit_referral_if_eligible
from app.services.wallet_service import credit_inr, debit_inr, to_wallet_out

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _txn_out(t: Transaction) -> TransactionOut:
    return TransactionOut(
        id=str(t.id),
        type=t.type,
        amount_inr=t.amount_paise / 100,
        gold_grams=t.gold_mg / 1000,
        rate_inr_per_gram=(t.rate_paise_per_g / 100) if t.rate_paise_per_g else None,
        status=t.status,
        note=t.note,
        created_at=t.created_at,
    )


@router.get("", response_model=WalletOut)
async def get_wallet(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    w = await user_repo.get_wallet(session, user.id)
    if not w:
        raise HTTPException(404, "wallet missing")
    return to_wallet_out(w)


# ---------- Manual / dev deposit (no real gateway) ----------
_METHOD_LABELS = {
    "MANUAL": "Manual / test",
    "UPI": "UPI",
    "CARD": "Card",
    "BANK_TRANSFER": "Bank transfer",
    "RAZORPAY": "Razorpay",
}


def _deposit_note(method: str, method_ref: str | None) -> str:
    label = _METHOD_LABELS.get(method, method)
    if method_ref:
        return f"Deposit via {label} ({method_ref}) — simulated"
    return f"Deposit via {label} — simulated"


@router.post("/deposit", response_model=WalletOut)
async def deposit(
    payload: DepositIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    paise = int(round(payload.amount_inr * 100))
    if paise <= 0:
        raise HTTPException(400, "amount must be positive")

    wallet = await credit_inr(session, str(user.id), paise)
    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=user.id,
            type=TxnType.DEPOSIT.value,
            amount_paise=paise,
            note=_deposit_note(payload.method, payload.method_ref),
        ),
    )

    await credit_referral_if_eligible(session, str(user.id))
    final = await user_repo.get_wallet(session, user.id)
    return to_wallet_out(final or wallet)


# ---------- Razorpay deposit (real Checkout flow) ----------
@router.post("/deposit/razorpay/order", response_model=RazorpayOrderOut)
async def create_razorpay_order_route(
    payload: RazorpayOrderIn,
    user: User = Depends(current_user),
) -> RazorpayOrderOut:
    """Step 1 — server creates a Razorpay Order. The frontend uses the returned
    `order_id` + `key_id` to launch Razorpay Checkout."""
    settings = get_settings()
    paise = int(round(payload.amount_inr * 100))
    if paise <= 0:
        raise HTTPException(400, "amount must be positive")

    receipt = f"dep_{str(user.id)[:8]}_{int(time.time())}"
    try:
        order = await razorpay_create_order(
            paise,
            receipt,
            notes={"user_id": str(user.id), "purpose": "wallet_deposit"},
        )
    except Exception as e:
        raise HTTPException(502, f"failed to create razorpay order: {e}")

    return RazorpayOrderOut(
        order_id=order["id"],
        amount=int(order["amount"]),
        currency=order.get("currency", "INR"),
        key_id=settings.razorpay_key_id,
        receipt=receipt,
    )


@router.post("/deposit/razorpay/verify", response_model=WalletOut)
async def verify_razorpay_payment_route(
    payload: RazorpayVerifyIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    """Step 2 — verify the signature Checkout returned, then credit the wallet.
    Without this signature check, anyone could call the endpoint and forge a deposit."""
    if not verify_payment_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    ):
        raise HTTPException(400, "invalid razorpay signature — payment not verified")

    paise = int(round(payload.amount_inr * 100))
    wallet = await credit_inr(session, str(user.id), paise)

    # Fetch the actual payment method (UPI/CARD/...) from Razorpay for the audit log.
    method_label = "Razorpay"
    try:
        payment = await razorpay_fetch_payment(payload.razorpay_payment_id)
        rzp_method = (payment.get("method") or "").upper()
        if rzp_method:
            method_label = f"Razorpay ({rzp_method})"
    except Exception:
        pass

    note = f"Deposit via {method_label} — payment {payload.razorpay_payment_id}"
    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=user.id,
            type=TxnType.DEPOSIT.value,
            amount_paise=paise,
            note=note,
        ),
    )

    await credit_referral_if_eligible(session, str(user.id))
    final = await user_repo.get_wallet(session, user.id)
    return to_wallet_out(final or wallet)


# ---------- Withdraw (with destination details for RazorpayX-style payout) ----------
def _withdraw_note(payload: WithdrawIn) -> str:
    if payload.method == "UPI":
        ref = payload.upi_id or "unknown"
        return f"Withdrawal to UPI ({ref}) — RazorpayX (simulated)"
    # BANK_TRANSFER
    masked = (
        f"•••• {payload.account_number[-4:]}"
        if payload.account_number
        else "••••"
    )
    return (
        f"Withdrawal to Bank ({payload.ifsc} {masked}, "
        f"{payload.account_holder or 'unnamed'}) — RazorpayX (simulated)"
    )


@router.post("/withdraw", response_model=WalletOut)
async def withdraw(
    payload: WithdrawIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    """Capture the destination, debit the wallet, log the payout intent.

    PRODUCTION TODO: replace the inline logging with a RazorpayX Payouts call —
    POST https://api.razorpay.com/v1/payouts with `fund_account_id` (UPI/bank).
    RazorpayX requires KYC + a separately-funded RazorpayX account, so it can't
    be exercised from a fresh sandbox. Until that's wired the wallet is debited
    and the destination is recorded for manual settlement.
    """
    paise = int(round(payload.amount_inr * 100))
    if paise <= 0:
        raise HTTPException(400, "amount must be positive")

    if payload.method == "UPI":
        if not payload.upi_id or "@" not in payload.upi_id:
            raise HTTPException(400, "valid UPI ID required (e.g. user@paytm)")
    else:  # BANK_TRANSFER
        if not (payload.account_number and payload.ifsc):
            raise HTTPException(400, "account number + IFSC required for bank withdrawal")

    wallet = await debit_inr(session, str(user.id), paise)

    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=user.id,
            type=TxnType.WITHDRAW.value,
            amount_paise=paise,
            note=_withdraw_note(payload),
        ),
    )
    return to_wallet_out(wallet)


@router.get("/transactions", response_model=list[TransactionOut])
async def transactions(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
    limit: int = 100,
) -> list[TransactionOut]:
    rows = await gold_repo.list_transactions(session, user.id, limit=limit)
    return [_txn_out(t) for t in rows]
