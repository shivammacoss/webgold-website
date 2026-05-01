"""Reverse-geocode lat/lng → city/region/country via OpenStreetMap Nominatim.

Nominatim is free and key-less. Per their usage policy we MUST send an
identifying User-Agent header and stay under ~1 req/sec.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)


@dataclass
class GeoPlace:
    country: str | None = None
    region: str | None = None
    city: str | None = None


async def reverse_geocode(lat: float, lng: float, timeout: float = 3.0) -> GeoPlace:
    """Best-effort lookup. Returns an empty GeoPlace on any failure — never blocks login."""
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": str(lat),
            "lon": str(lng),
            "zoom": "10",
            "addressdetails": "1",
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(
                url,
                params=params,
                headers={"User-Agent": "mysafeGold/0.1 (dev)"},
            )
            r.raise_for_status()
            data = r.json() or {}
        addr = data.get("address") or {}
        return GeoPlace(
            country=addr.get("country") or None,
            region=(addr.get("state") or addr.get("region")) or None,
            city=(addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb")) or None,
        )
    except Exception as e:
        logger.debug("nominatim reverse geo failed for %s,%s: %s", lat, lng, e)
        return GeoPlace()
