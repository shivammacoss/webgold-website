"""GoldAPI.io client — direct INR/g spot quote (requires a real API key)."""
import logging
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings
from app.core.constants import TROY_OZ_TO_G
from app.models.gold import GoldRate

logger = logging.getLogger(__name__)


def _is_real_key(key: str) -> bool:
    return bool(key) and key != "goldapi-demo"


async def fetch_goldapi_rate(client: httpx.AsyncClient) -> GoldRate | None:
    settings = get_settings()
    if not _is_real_key(settings.gold_api_key):
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
        return GoldRate(
            paise_per_g=paise,
            fetched_at=datetime.now(timezone.utc),
            source="goldapi.io",
        )
    except Exception as e:
        logger.warning("goldapi fetch failed: %s", e)
        return None
