"""Free IP-geolocation lookup via ip-api.com (no API key, 45 req/min)."""
from __future__ import annotations

import ipaddress
import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)


@dataclass
class IpGeo:
    country: str | None = None
    region: str | None = None
    city: str | None = None
    lat: float | None = None
    lng: float | None = None


def _is_private_or_local(ip: str) -> bool:
    if not ip or ip == "unknown":
        return True
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True
    return addr.is_private or addr.is_loopback or addr.is_link_local


async def lookup_ip_geo(ip: str, timeout: float = 2.0) -> IpGeo:
    """Best-effort lookup. Returns an empty IpGeo if the IP is private/local
    or the upstream call fails — we never block login on this."""
    if _is_private_or_local(ip):
        return IpGeo()
    try:
        url = f"http://ip-api.com/json/{ip}?fields=country,regionName,city,lat,lon"
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
        return IpGeo(
            country=data.get("country") or None,
            region=data.get("regionName") or None,
            city=data.get("city") or None,
            lat=float(data["lat"]) if data.get("lat") is not None else None,
            lng=float(data["lon"]) if data.get("lon") is not None else None,
        )
    except Exception as e:
        logger.debug("ip geo lookup failed for %s: %s", ip, e)
        return IpGeo()
