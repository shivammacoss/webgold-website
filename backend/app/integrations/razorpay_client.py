"""Razorpay integration — Orders API for collection (deposit) flow.

Uses raw httpx so we don't drag in the official SDK. The two endpoints we need:
- POST /v1/orders          → server creates an order, returns order_id
- HMAC-SHA256 verification → server verifies the signature returned by Checkout

For real payouts (withdrawals) you need RazorpayX (a different Razorpay product
with KYC + a funding account). Until that's set up the withdraw flow records
the destination but skips the actual payout API call — see notes below.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

RAZORPAY_BASE = "https://api.razorpay.com/v1"


def _basic_auth_header() -> dict[str, str]:
    settings = get_settings()
    creds = base64.b64encode(
        f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode()
    ).decode()
    return {"Authorization": f"Basic {creds}"}


async def create_order(
    amount_paise: int,
    receipt: str,
    notes: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Creates a Razorpay Order. Returns the raw response dict."""
    payload: dict[str, Any] = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt[:40],  # Razorpay limit
        "payment_capture": 1,     # auto-capture on success
    }
    if notes:
        payload["notes"] = notes

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{RAZORPAY_BASE}/orders",
            headers={**_basic_auth_header(), "Content-Type": "application/json"},
            json=payload,
        )
        if r.status_code >= 400:
            logger.error("razorpay create_order failed: %s %s", r.status_code, r.text)
            raise RuntimeError(f"razorpay error: {r.text}")
        return r.json()


def verify_payment_signature(
    order_id: str, payment_id: str, signature: str
) -> bool:
    """HMAC-SHA256(`order_id|payment_id`, key=secret) == signature.

    This is Razorpay's official client-side payment verification scheme.
    """
    settings = get_settings()
    body = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def fetch_payment(payment_id: str) -> dict[str, Any]:
    """Optional: fetch payment details (method, captured status, etc.) for the
    audit log. Useful for sanity-checking what the user actually paid with."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{RAZORPAY_BASE}/payments/{payment_id}",
            headers=_basic_auth_header(),
        )
        if r.status_code >= 400:
            logger.warning("razorpay fetch_payment failed: %s %s", r.status_code, r.text)
            return {}
        return r.json()
