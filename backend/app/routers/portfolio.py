from fastapi import APIRouter, Depends

from app.deps import current_user
from app.models import FDStatus, GoldFD, Transaction, TxnType, User, Wallet
from app.schemas import PortfolioOut
from app.services.gold_rate import get_rate

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


async def _sum_amount(user_id: str, txn_type: str) -> int:
    coll = Transaction.get_pymongo_collection()
    pipeline = [
        {"$match": {"user_id": user_id, "type": txn_type}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paise"}}},
    ]
    cursor = await coll.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    return docs[0]["total"] if docs else 0


@router.get("", response_model=PortfolioOut)
async def portfolio(user: User = Depends(current_user)) -> PortfolioOut:
    uid = str(user.id)
    wallet = await Wallet.find_one(Wallet.user_id == uid)
    rate = (await get_rate()).paise_per_g

    active_fds = await GoldFD.find(
        GoldFD.user_id == uid, GoldFD.status == FDStatus.ACTIVE.value
    ).to_list()
    locked_mg = sum(fd.principal_mg for fd in active_fds)

    invested_paise = await _sum_amount(uid, TxnType.BUY_GOLD.value)
    realized_paise = await _sum_amount(uid, TxnType.SELL_GOLD.value)

    total_gold_mg = (wallet.gold_mg if wallet else 0) + locked_mg
    gold_value_paise = (total_gold_mg * rate) // 1000

    cost_basis = invested_paise - realized_paise
    pnl_paise = gold_value_paise - cost_basis
    pnl_pct = (pnl_paise / cost_basis * 100) if cost_basis > 0 else 0.0

    return PortfolioOut(
        gold_grams=total_gold_mg / 1000,
        inr_balance=(wallet.inr_paise if wallet else 0) / 100,
        gold_value_inr=gold_value_paise / 100,
        invested_inr=cost_basis / 100,
        pnl_inr=pnl_paise / 100,
        pnl_pct=round(pnl_pct, 2),
        active_fds=len(active_fds),
        locked_grams=locked_mg / 1000,
    )
