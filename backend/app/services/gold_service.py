"""Live gold rate with 60s cache, multi-currency FX, and buy/sell spread math.

Sources (priority): GoldAPI.io → Yahoo Finance → hardcoded fallback.
Persists a snapshot every 5 min for the rate-history chart.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings
from app.core.constants import (
    GOLD_RATE_CACHE_TTL_SEC,
    GOLD_RATE_SNAPSHOT_INTERVAL_SEC,
)
from app.db.client import session_scope
from app.integrations.gold_api_client import fetch_goldapi_rate
from app.integrations.yahoo_client import (
    DIRECT_INR_PAIRS,
    FX_FALLBACK_PER_INR,
    USD_DERIVED,
    fetch_yahoo_fx_rates,
    fetch_yahoo_gold_rate,
)
from app.models.gold import GoldRate
from app.repositories import gold_repo

logger = logging.getLogger(__name__)
settings = get_settings()

_cache: GoldRate | None = None
_last_snapshot_ts: float = 0.0
_lock = asyncio.Lock()

_fx_cache: dict[str, tuple[float, datetime]] = {}
_fx_lock = asyncio.Lock()


def _fallback_rate() -> GoldRate:
    return GoldRate(
        paise_per_g=1_500_000,
        fetched_at=datetime.now(timezone.utc),
        source="fallback",
    )


async def _fetch_remote() -> GoldRate:
    async with httpx.AsyncClient() as client:
        rate = await fetch_goldapi_rate(client)
        if rate:
            return rate
        rate = await fetch_yahoo_gold_rate(client)
        if rate:
            return rate
    logger.warning("all upstream rate sources failed, using fallback")
    return _fallback_rate()


async def _persist_snapshot(rate: GoldRate) -> None:
    """Standalone session — runs outside any FastAPI request context."""
    async for session in session_scope():
        await gold_repo.insert_rate_snap(
            session, rate.paise_per_g, rate.source, rate.fetched_at
        )


async def get_rate() -> GoldRate:
    global _cache, _last_snapshot_ts

    async with _lock:
        now = time.time()
        if _cache and (datetime.now(timezone.utc) - _cache.fetched_at).total_seconds() < GOLD_RATE_CACHE_TTL_SEC:
            return _cache

        rate = await _fetch_remote()
        _cache = rate

        if (now - _last_snapshot_ts) > GOLD_RATE_SNAPSHOT_INTERVAL_SEC:
            try:
                await _persist_snapshot(rate)
                _last_snapshot_ts = now
            except Exception:
                logger.exception("failed to write rate snapshot")

        return rate


async def get_fx_rates() -> dict[str, float]:
    """INR-per-1-unit for every supported currency. Cached for 60s."""
    async with _fx_lock:
        now = datetime.now(timezone.utc)
        cached = {
            ccy: pair[0]
            for ccy, pair in _fx_cache.items()
            if (now - pair[1]).total_seconds() < GOLD_RATE_CACHE_TTL_SEC
        }
        if len(cached) == len(DIRECT_INR_PAIRS) + len(USD_DERIVED) + 1:  # +1 for INR
            return cached

        try:
            out = await fetch_yahoo_fx_rates()
        except Exception:
            logger.exception("FX fetch failed, using fallback")
            out = {"INR": 1.0, **FX_FALLBACK_PER_INR}

        _fx_cache.update({c: (r, now) for c, r in out.items() if c != "INR"})
        return out


async def get_usd_inr() -> float:
    fx = await get_fx_rates()
    return fx.get("USD", 85.0)


def buy_rate_paise_per_g(base_paise: int) -> int:
    return base_paise + (base_paise * settings.gold_buy_markup_bps) // 10_000


def sell_rate_paise_per_g(base_paise: int) -> int:
    return base_paise - (base_paise * settings.gold_sell_discount_bps) // 10_000
