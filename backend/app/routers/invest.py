from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user
from app.models import Transaction, TxnType, User
from app.schemas import AmountIn, GramsIn, WalletOut
from app.services.gold_rate import (
    buy_rate_paise_per_g,
    get_rate,
    sell_rate_paise_per_g,
)
from app.services.wallet import (
    InsufficientBalance,
    swap_gold_for_inr,
    swap_inr_for_gold,
)

router = APIRouter(prefix="/invest", tags=["invest"])


def _wallet_out(w) -> WalletOut:
    return WalletOut(
        inr_balance=w.inr_paise / 100,
        gold_grams=w.gold_mg / 1000,
        updated_at=w.updated_at,
    )


@router.post("/gold/buy", response_model=WalletOut)
async def buy_gold(payload: AmountIn, user: User = Depends(current_user)) -> WalletOut:
    paise = int(round(payload.amount_inr * 100))
    rate = buy_rate_paise_per_g((await get_rate()).paise_per_g)
    grams_mg = (paise * 1000) // rate
    if grams_mg <= 0:
        raise HTTPException(400, "amount too small to buy any gold")

    try:
        wallet = await swap_inr_for_gold(str(user.id), paise, grams_mg)
    except InsufficientBalance:
        raise HTTPException(400, "insufficient INR balance")

    await Transaction(
        user_id=str(user.id),
        type=TxnType.BUY_GOLD.value,
        amount_paise=paise,
        gold_mg=grams_mg,
        rate_paise_per_g=rate,
        note=f"Bought {grams_mg / 1000:.4f} g at ₹{rate / 100:.2f}/g",
    ).insert()

    return _wallet_out(wallet)


@router.post("/gold/sell", response_model=WalletOut)
async def sell_gold(payload: GramsIn, user: User = Depends(current_user)) -> WalletOut:
    grams_mg = int(round(payload.grams * 1000))
    rate = sell_rate_paise_per_g((await get_rate()).paise_per_g)
    paise = (grams_mg * rate) // 1000

    try:
        wallet = await swap_gold_for_inr(str(user.id), grams_mg, paise)
    except InsufficientBalance:
        raise HTTPException(400, "insufficient gold balance")

    await Transaction(
        user_id=str(user.id),
        type=TxnType.SELL_GOLD.value,
        amount_paise=paise,
        gold_mg=grams_mg,
        rate_paise_per_g=rate,
        note=f"Sold {grams_mg / 1000:.4f} g at ₹{rate / 100:.2f}/g",
    ).insert()

    return _wallet_out(wallet)
