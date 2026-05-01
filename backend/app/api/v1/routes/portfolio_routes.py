from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user, get_session
from app.models.gold import TxnType
from app.models.user import User
from app.repositories import fd_repo, gold_repo, user_repo
from app.schemas.portfolio_schema import PortfolioOut
from app.services.gold_service import get_rate

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioOut)
async def portfolio(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> PortfolioOut:
    uid = user.id
    wallet = await user_repo.get_wallet(session, uid)
    rate = (await get_rate()).paise_per_g

    active_fds = await fd_repo.list_active_fds_by_user(session, uid)
    locked_mg = sum(fd.principal_mg for fd in active_fds)

    invested_paise = await gold_repo.sum_amount_paise(session, uid, TxnType.BUY_GOLD.value)
    realized_paise = await gold_repo.sum_amount_paise(session, uid, TxnType.SELL_GOLD.value)

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
