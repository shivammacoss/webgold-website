"""Yahoo Finance client — gold futures + multi-currency FX, no key needed."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

import httpx

from app.core.constants import INDIA_RETAIL_MARKUP_BPS, TROY_OZ_TO_G
from app.models.gold import GoldRate

logger = logging.getLogger(__name__)

YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/"
YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0 (mysafeGold)"}

# Direct INR pairs.
DIRECT_INR_PAIRS = {
    "USD": "USDINR=X",
    "EUR": "EURINR=X",
    "GBP": "GBPINR=X",
    "JPY": "JPYINR=X",
    "CNY": "CNYINR=X",
    "AED": "AEDINR=X",
    "CHF": "CHFINR=X",
}
# No direct INR pair on Yahoo — derive via USD.
USD_DERIVED = {
    "RUB": "USDRUB=X",
    "SAR": "USDSAR=X",
}

# Last-resort static FX fallbacks (April 2026 baselines). INR per 1 unit.
FX_FALLBACK_PER_INR = {
    "USD": 85.0, "EUR": 92.0, "GBP": 110.0, "JPY": 0.55,
    "CNY": 11.7, "AED": 23.1, "CHF": 95.0, "RUB": 1.05, "SAR": 22.6,
}


def _parse_yahoo_price(payload: dict) -> float | None:
    try:
        return float(payload["chart"]["result"][0]["meta"]["regularMarketPrice"])
    except (KeyError, IndexError, TypeError, ValueError):
        return None


async def fetch_yahoo_quote(client: httpx.AsyncClient, ticker: str) -> float | None:
    try:
        r = await client.get(f"{YAHOO_BASE}{ticker}", headers=YAHOO_HEADERS, timeout=8.0)
        r.raise_for_status()
        return _parse_yahoo_price(r.json())
    except Exception as e:
        logger.debug("yahoo %s failed: %s", ticker, e)
        return None


async def fetch_yahoo_gold_rate(client: httpx.AsyncClient) -> GoldRate | None:
    """Gold futures × USD/INR + Indian retail markup → INR per gram."""
    gold = await fetch_yahoo_quote(client, "GC=F")
    usd_inr = await fetch_yahoo_quote(client, "USDINR=X")
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


async def fetch_yahoo_fx_rates() -> dict[str, float]:
    """Returns INR-per-1-unit for every supported currency. INR itself is 1.0."""
    async with httpx.AsyncClient() as client:
        direct_tasks = {
            ccy: fetch_yahoo_quote(client, t) for ccy, t in DIRECT_INR_PAIRS.items()
        }
        usd_inr_task = fetch_yahoo_quote(client, "USDINR=X")
        derived_tasks = {
            ccy: fetch_yahoo_quote(client, t) for ccy, t in USD_DERIVED.items()
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

    for (ccy, _), val in zip(direct_tasks.items(), direct_results):
        if isinstance(val, (int, float)) and val > 0:
            out[ccy] = float(val)
        else:
            out[ccy] = FX_FALLBACK_PER_INR[ccy]

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

    return out
