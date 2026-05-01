from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.repositories import gold_repo
from app.schemas.gold_schema import GoldRateOut, GoldRatePoint
from app.services.gold_service import (
    buy_rate_paise_per_g,
    get_fx_rates,
    get_rate,
    sell_rate_paise_per_g,
)

router = APIRouter(prefix="/gold", tags=["gold"])


@router.get("/rate", response_model=GoldRateOut)
async def rate() -> GoldRateOut:
    r = await get_rate()
    fx = await get_fx_rates()
    base = r.paise_per_g
    buy_p = buy_rate_paise_per_g(base)
    sell_p = sell_rate_paise_per_g(base)
    usd_inr = fx.get("USD", r.usd_inr or 85.0)

    inr_per_g = base / 100
    return GoldRateOut(
        inr_per_gram=inr_per_g,
        buy_inr_per_gram=buy_p / 100,
        sell_inr_per_gram=sell_p / 100,
        usd_per_gram=inr_per_g / usd_inr,
        buy_usd_per_gram=(buy_p / 100) / usd_inr,
        sell_usd_per_gram=(sell_p / 100) / usd_inr,
        usd_inr=usd_inr,
        fx=fx,
        fetched_at=r.fetched_at,
        source=r.source,
    )


@router.get("/rate/history", response_model=list[GoldRatePoint])
async def history(
    range: str = Query("1w", pattern="^(1d|1w|1m|1y)$"),
    session: AsyncSession = Depends(get_session),
) -> list[GoldRatePoint]:
    delta = {"1d": timedelta(days=1), "1w": timedelta(weeks=1),
             "1m": timedelta(days=30), "1y": timedelta(days=365)}[range]
    since = datetime.now(timezone.utc) - delta
    rows = await gold_repo.list_rate_snaps_since(session, since)
    return [GoldRatePoint(inr_per_gram=r.paise_per_g / 100, fetched_at=r.fetched_at) for r in rows]
