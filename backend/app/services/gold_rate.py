"""Live gold rate fetcher with 60s in-process cache + multi-currency FX.

Sources (in priority order):
1. GoldAPI.io (if a real key is in `GOLD_API_KEY`) — best, direct INR/g.
2. Yahoo Finance free endpoint — gold futures (USD/oz) + USD/INR FX, no key needed.
3. Hardcoded fallback — only if both fail.

We also fetch FX rates for the major gold-market currencies in parallel so the
client can render prices in the user's preferred display currency.

Indian retail gold sells at ~8-12% over the international futures price (jewellery
markup, GST, MCX premium). We apply `INDIA_RETAIL_MARKUP_BPS` so the displayed
INR/g matches what users actually see at jewellers.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone

import httpx

from app.config import get_settings
from app.models import GoldRate, GoldRateSnap

logger = logging.getLogger(__name__)
settings = get_settings()

CACHE_TTL_SEC = 60
TROY_OZ_TO_G = 31.1034768
SNAPSHOT_INTERVAL_SEC = 5 * 60

# Indian retail premium over international spot.
INDIA_RETAIL_MARKUP_BPS = 1000   # 10%

YAHOO_GOLD = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F"
YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/"
YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0 (mysafeGold)"}

# Currencies we expose. Direct INR pairs where Yahoo has them, else derive via USD.
DIRECT_INR_PAIRS = {
    "USD": "USDINR=X",
    "EUR": "EURINR=X",
    "GBP": "GBPINR=X",
    "JPY": "JPYINR=X",
    "CNY": "CNYINR=X",   # China yuan
    "AED": "AEDINR=X",   # UAE dirham (Dubai)
    "CHF": "CHFINR=X",   # Swiss franc
}
# These don't have direct INR pairs on Yahoo — derive via USD.
USD_DERIVED = {
    "RUB": "USDRUB=X",   # Russian ruble
    "SAR": "USDSAR=X",   # Saudi riyal
}

# Last-resort static fallbacks (April 2026 baselines) used only if Yahoo is
# unreachable for a given currency. INR per 1 unit of currency.
FX_FALLBACK_PER_INR = {
    "USD": 85.0, "EUR": 92.0, "GBP": 110.0, "JPY": 0.55,
    "CNY": 11.7, "AED": 23.1, "CHF": 95.0, "RUB": 1.05, "SAR": 22.6,
}

_cache: GoldRate | None = None
_last_snapshot_ts: float = 0.0
_lock = asyncio.Lock()

# Multi-currency FX cache: { "USD": (rate, fetched_at), ... }
_fx_cache: dict[str, tuple[float, datetime]] = {}
_fx_lock = asyncio.Lock()


def _fallback_rate() -> GoldRate:
    return GoldRate(
        paise_per_g=1_500_000,
        fetched_at=datetime.now(timezone.utc),
        source="fallback",
    )


def _is_real_goldapi_key(key: str) -> bool:
    return bool(key) and key != "goldapi-demo"


def _yahoo_price(payload: dict) -> float | None:
    try:
        return float(payload["chart"]["result"][0]["meta"]["regularMarketPrice"])
    except (KeyError, IndexError, TypeError, ValueError):
        return None


async def _fetch_goldapi(client: httpx.AsyncClient) -> GoldRate | None:
    if not _is_real_goldapi_key(settings.gold_api_key):
        return None
    try:
        r = await client.get(
            settings.gold_api_url,
            headers={"x-access-token": settings.gold_api_key, "Content-Type": "application/json"},
            timeout=8.0,
        )
        r.raise_for_status()
        data = r.json()
        if data.get("price_gram_24k"):
            paise = int(round(float(data["price_gram_24k"]) * 100))
        elif data.get("price"):
            paise = int(round(float(data["price"]) / TROY_OZ_TO_G * 100))
        else:
            return None
        if paise <= 0:
            return None
        return GoldRate(paise_per_g=paise, fetched_at=datetime.now(timezone.utc), source="goldapi.io")
    except Exception as e:
        logger.warning("goldapi fetch failed: %s", e)
        return None


async def _fetch_yahoo_quote(client: httpx.AsyncClient, ticker: str) -> float | None:
    try:
        r = await client.get(f"{YAHOO_BASE}{ticker}", headers=YAHOO_HEADERS, timeout=8.0)
        r.raise_for_status()
        return _yahoo_price(r.json())
    except Exception as e:
        logger.debug("yahoo %s failed: %s", ticker, e)
        return None


async def _fetch_yahoo_gold_and_fx(client: httpx.AsyncClient) -> GoldRate | None:
    """Fetches gold futures + USD/INR for the headline rate."""
    gold = await _fetch_yahoo_quote(client, "GC=F")
    usd_inr = await _fetch_yahoo_quote(client, "USDINR=X")
    if not gold or not usd_inr:
        return None

    inr_per_g_intl = (gold * usd_inr) / TROY_OZ_TO_G
    retail = inr_per_g_intl * (1 + INDIA_RETAIL_MARKUP_BPS / 10_000)
    paise = int(round(retail * 100))

    return GoldRate(
        paise_per_g=paise,
        fetched_at=datetime.now(timezone.utc),
        source=f"yahoo (${gold:.0f}/oz × ₹{usd_inr:.2f})",
        usd_inr=usd_inr,
    )


async def _fetch_remote() -> GoldRate:
    async with httpx.AsyncClient() as client:
        rate = await _fetch_goldapi(client)
        if rate:
            return rate
        rate = await _fetch_yahoo_gold_and_fx(client)
        if rate:
            return rate
    logger.warning("all upstream rate sources failed, using fallback")
    return _fallback_rate()


async def get_rate() -> GoldRate:
    global _cache, _last_snapshot_ts

    async with _lock:
        now = time.time()
        if _cache and (datetime.now(timezone.utc) - _cache.fetched_at).total_seconds() < CACHE_TTL_SEC:
            return _cache

        rate = await _fetch_remote()
        _cache = rate

        if (now - _last_snapshot_ts) > SNAPSHOT_INTERVAL_SEC:
            try:
                await GoldRateSnap(
                    paise_per_g=rate.paise_per_g,
                    source=rate.source,
                    fetched_at=rate.fetched_at,
                ).insert()
                _last_snapshot_ts = now
            except Exception:
                logger.exception("failed to write rate snapshot")

        return rate


async def get_fx_rates() -> dict[str, float]:
    """Returns INR-per-1-unit for every supported currency. INR itself is 1.0.

    Cached for 60s. On failure, falls back to the hardcoded baselines so the
    UI always has *something* to render.
    """
    async with _fx_lock:
        now = datetime.now(timezone.utc)
        # Fast path: every entry is fresh
        cached = {
            ccy: pair[0]
            for ccy, pair in _fx_cache.items()
            if (now - pair[1]).total_seconds() < CACHE_TTL_SEC
        }
        if len(cached) == len(DIRECT_INR_PAIRS) + len(USD_DERIVED) + 1:  # +1 for INR
            return cached

        # Refetch
        async with httpx.AsyncClient() as client:
            direct_tasks = {
                ccy: _fetch_yahoo_quote(client, t) for ccy, t in DIRECT_INR_PAIRS.items()
            }
            usd_inr_task = _fetch_yahoo_quote(client, "USDINR=X")
            derived_tasks = {
                ccy: _fetch_yahoo_quote(client, t) for ccy, t in USD_DERIVED.items()
            }
            results = await asyncio.gather(
                usd_inr_task,
                *direct_tasks.values(),
                *derived_tasks.values(),
                return_exceptions=True,
            )

        usd_inr = results[0] if isinstance(results[0], (int, float)) else None
        direct_results = results[1 : 1 + len(direct_tasks)]
        derived_results = results[1 + len(direct_tasks) :]

        out: dict[str, float] = {"INR": 1.0}

        # Direct pairs
        for (ccy, _), val in zip(direct_tasks.items(), direct_results):
            if isinstance(val, (int, float)) and val > 0:
                out[ccy] = float(val)
            else:
                out[ccy] = FX_FALLBACK_PER_INR[ccy]

        # USD-derived: 1 ccy = USDINR / USDccy
        for (ccy, _), val in zip(derived_tasks.items(), derived_results):
            if (
                isinstance(val, (int, float))
                and val > 0
                and isinstance(usd_inr, (int, float))
                and usd_inr > 0
            ):
                out[ccy] = float(usd_inr) / float(val)
            else:
                out[ccy] = FX_FALLBACK_PER_INR[ccy]

        _fx_cache.update({c: (r, now) for c, r in out.items() if c != "INR"})
        return out


async def get_usd_inr() -> float:
    """Backward-compat helper kept for the existing /gold/rate route."""
    fx = await get_fx_rates()
    return fx.get("USD", 85.0)


def buy_rate_paise_per_g(base_paise: int) -> int:
    return base_paise + (base_paise * settings.gold_buy_markup_bps) // 10_000


def sell_rate_paise_per_g(base_paise: int) -> int:
    return base_paise - (base_paise * settings.gold_sell_discount_bps) // 10_000
