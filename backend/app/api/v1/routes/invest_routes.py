import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user, get_session
from app.core.config import get_settings
from app.exceptions.custom_exceptions import AmountTooSmall
from app.integrations.razorpay_client import (
    create_order as razorpay_create_order,
    fetch_payment as razorpay_fetch_payment,
    verify_payment_signature,
)
from app.models.gold import Transaction, TxnType
from app.models.user import User
from app.repositories import gold_repo
from app.schemas.gold_schema import (
    BuyGoldIn,
    BuyGoldRazorpayOrderIn,
    BuyGoldRazorpayOrderOut,
    BuyGoldRazorpayVerifyIn,
    GramsIn,
)
from app.schemas.wallet_schema import WalletOut
from app.services.gold_service import (
    buy_rate_paise_per_g,
    get_rate,
    sell_rate_paise_per_g,
)
from app.services.wallet_service import (
    credit_gold,
    swap_gold_for_inr,
    to_wallet_out,
)

router = APIRouter(prefix="/invest", tags=["invest"])

_METHOD_LABELS = {
    "MANUAL": "Manual / test",
    "UPI": "UPI",
    "CARD": "Card",
    "BANK_TRANSFER": "Bank transfer",
}


def _payment_suffix(method: str, method_ref: str | None) -> str:
    label = _METHOD_LABELS.get(method, method)
    return f" via {label} ({method_ref})" if method_ref else f" via {label}"


@router.post("/gold/buy", response_model=WalletOut)
async def buy_gold(
    payload: BuyGoldIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    """Direct-payment gold buy.

    Pays through the chosen method (UPI/Card/Bank/Manual — all simulated) and
    credits the gold_mg side of the wallet. The INR balance is never touched.
    """
    paise = int(round(payload.amount_inr * 100))
    rate = buy_rate_paise_per_g((await get_rate()).paise_per_g)
    grams_mg = (paise * 1000) // rate
    if grams_mg <= 0:
        raise AmountTooSmall("amount too small to buy any gold")

    wallet = await credit_gold(session, str(user.id), grams_mg)

    note = (
        f"Bought {grams_mg / 1000:.4f} g at ₹{rate / 100:.2f}/g"
        + _payment_suffix(payload.method, payload.method_ref)
        + " — simulated"
    )
    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=user.id,
            type=TxnType.BUY_GOLD.value,
            amount_paise=paise,
            gold_mg=grams_mg,
            rate_paise_per_g=rate,
            note=note,
        ),
    )

    return to_wallet_out(wallet)


# ---------- Razorpay buy-gold flow ----------
@router.post("/gold/buy/razorpay/order", response_model=BuyGoldRazorpayOrderOut)
async def create_buygold_razorpay_order(
    payload: BuyGoldRazorpayOrderIn,
    user: User = Depends(current_user),
) -> BuyGoldRazorpayOrderOut:
    """Step 1 — server creates a Razorpay Order for a gold purchase."""
    settings = get_settings()
    paise = int(round(payload.amount_inr * 100))
    if paise <= 0:
        raise HTTPException(400, "amount must be positive")

    receipt = f"buy_{str(user.id)[:8]}_{int(time.time())}"
    try:
        order = await razorpay_create_order(
            paise,
            receipt,
            notes={"user_id": str(user.id), "purpose": "buy_gold"},
        )
    except Exception as e:
        raise HTTPException(502, f"failed to create razorpay order: {e}")

    return BuyGoldRazorpayOrderOut(
        order_id=order["id"],
        amount=int(order["amount"]),
        currency=order.get("currency", "INR"),
        key_id=settings.razorpay_key_id,
        receipt=receipt,
    )


@router.post("/gold/buy/razorpay/verify", response_model=WalletOut)
async def verify_buygold_razorpay_payment(
    payload: BuyGoldRazorpayVerifyIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    """Step 2 — verify the signature, then credit gold (no INR debit)."""
    if not verify_payment_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    ):
        raise HTTPException(400, "invalid razorpay signature — payment not verified")

    paise = int(round(payload.amount_inr * 100))
    rate = buy_rate_paise_per_g((await get_rate()).paise_per_g)
    grams_mg = (paise * 1000) // rate
    if grams_mg <= 0:
        raise AmountTooSmall("amount too small to buy any gold")

    wallet = await credit_gold(session, str(user.id), grams_mg)

    method_label = "Razorpay"
    try:
        payment = await razorpay_fetch_payment(payload.razorpay_payment_id)
        rzp_method = (payment.get("method") or "").upper()
        if rzp_method:
            method_label = f"Razorpay ({rzp_method})"
    except Exception:
        pass

    note = (
        f"Bought {grams_mg / 1000:.4f} g at ₹{rate / 100:.2f}/g via {method_label}"
        f" — payment {payload.razorpay_payment_id}"
    )
    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=user.id,
            type=TxnType.BUY_GOLD.value,
            amount_paise=paise,
            gold_mg=grams_mg,
            rate_paise_per_g=rate,
            note=note,
        ),
    )
    return to_wallet_out(wallet)


@router.post("/gold/sell", response_model=WalletOut)
async def sell_gold(
    payload: GramsIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletOut:
    grams_mg = int(round(payload.grams * 1000))
    rate = sell_rate_paise_per_g((await get_rate()).paise_per_g)
    paise = (grams_mg * rate) // 1000

    wallet = await swap_gold_for_inr(session, str(user.id), grams_mg, paise)

    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=user.id,
            type=TxnType.SELL_GOLD.value,
            amount_paise=paise,
            gold_mg=grams_mg,
            rate_paise_per_g=rate,
            note=f"Sold {grams_mg / 1000:.4f} g at ₹{rate / 100:.2f}/g",
        ),
    )

    return to_wallet_out(wallet)
