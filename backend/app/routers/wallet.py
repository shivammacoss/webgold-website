from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user
from app.models import Transaction, TxnType, User, Wallet
from app.schemas import AmountIn, TransactionOut, WalletOut
from app.services.referral import credit_referral_if_eligible
from app.services.wallet import InsufficientBalance, credit_inr, debit_inr

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _wallet_out(w: Wallet) -> WalletOut:
    return WalletOut(
        inr_balance=w.inr_paise / 100,
        gold_grams=w.gold_mg / 1000,
        updated_at=w.updated_at,
    )


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
async def get_wallet(user: User = Depends(current_user)) -> WalletOut:
    w = await Wallet.find_one(Wallet.user_id == str(user.id))
    if not w:
        raise HTTPException(404, "wallet missing")
    return _wallet_out(w)


@router.post("/deposit", response_model=WalletOut)
async def deposit(payload: AmountIn, user: User = Depends(current_user)) -> WalletOut:
    paise = int(round(payload.amount_inr * 100))
    if paise <= 0:
        raise HTTPException(400, "amount must be positive")

    wallet = await credit_inr(str(user.id), paise)
    await Transaction(
        user_id=str(user.id),
        type=TxnType.DEPOSIT.value,
        amount_paise=paise,
        note="Wallet deposit (simulated)",
    ).insert()

    await credit_referral_if_eligible(str(user.id))
    # refetch in case the referral bonus changed it
    final = await Wallet.find_one(Wallet.user_id == str(user.id))
    return _wallet_out(final or wallet)


@router.post("/withdraw", response_model=WalletOut)
async def withdraw(payload: AmountIn, user: User = Depends(current_user)) -> WalletOut:
    paise = int(round(payload.amount_inr * 100))
    try:
        wallet = await debit_inr(str(user.id), paise)
    except InsufficientBalance:
        raise HTTPException(400, "insufficient INR balance")

    await Transaction(
        user_id=str(user.id),
        type=TxnType.WITHDRAW.value,
        amount_paise=paise,
        note="Wallet withdrawal (simulated)",
    ).insert()
    return _wallet_out(wallet)


@router.get("/transactions", response_model=list[TransactionOut])
async def transactions(
    user: User = Depends(current_user),
    limit: int = 100,
) -> list[TransactionOut]:
    rows = await (
        Transaction.find(Transaction.user_id == str(user.id))
        .sort("-created_at")
        .limit(limit)
        .to_list()
    )
    return [_txn_out(t) for t in rows]
