"""Atomic wallet mutations using MongoDB $inc with conditional filters.

Why this matters: MongoDB has no row-level locks. Two concurrent withdrawals could
both read balance=100 and both succeed at -50, leaving balance=0 instead of -50.
The fix is `findAndModify` with a guard:

    UPDATE wallets SET inr_paise = inr_paise + delta
    WHERE user_id = ? AND inr_paise + delta >= 0

If the row doesn't match (insufficient funds), the update returns None and we error.
This is the standard fintech pattern for ledger systems on Mongo.
"""
from datetime import datetime, timezone

from app.models import Wallet


class InsufficientBalance(Exception):
    pass


async def _apply(user_id: str, *, delta_paise: int = 0, delta_mg: int = 0) -> Wallet:
    """Atomic balance change. Raises InsufficientBalance if the resulting
    balance would be negative."""
    query: dict = {"user_id": user_id}
    if delta_paise < 0:
        query["inr_paise"] = {"$gte": -delta_paise}
    if delta_mg < 0:
        query["gold_mg"] = {"$gte": -delta_mg}

    inc_doc: dict = {}
    if delta_paise:
        inc_doc["inr_paise"] = delta_paise
    if delta_mg:
        inc_doc["gold_mg"] = delta_mg

    update: dict = {"$set": {"updated_at": datetime.now(timezone.utc)}}
    if inc_doc:
        update["$inc"] = inc_doc

    coll = Wallet.get_pymongo_collection()
    raw = await coll.find_one_and_update(
        query, update, return_document=True
    )
    if raw is None:
        # Either wallet doesn't exist (shouldn't happen — created at signup)
        # or guard failed (insufficient funds).
        existing = await Wallet.find_one(Wallet.user_id == user_id)
        if not existing:
            raise RuntimeError(f"wallet missing for user {user_id}")
        raise InsufficientBalance()

    # Beanie doesn't have a clean way to hydrate from raw — refetch.
    return await Wallet.find_one(Wallet.user_id == user_id)  # type: ignore[return-value]


async def credit_inr(user_id: str, paise: int) -> Wallet:
    return await _apply(user_id, delta_paise=paise)


async def debit_inr(user_id: str, paise: int) -> Wallet:
    return await _apply(user_id, delta_paise=-paise)


async def credit_gold(user_id: str, mg: int) -> Wallet:
    return await _apply(user_id, delta_mg=mg)


async def debit_gold(user_id: str, mg: int) -> Wallet:
    return await _apply(user_id, delta_mg=-mg)


async def swap_inr_for_gold(user_id: str, paise_out: int, mg_in: int) -> Wallet:
    """Atomic INR-out + gold-in (used for buying gold)."""
    return await _apply(user_id, delta_paise=-paise_out, delta_mg=mg_in)


async def swap_gold_for_inr(user_id: str, mg_out: int, paise_in: int) -> Wallet:
    """Atomic gold-out + INR-in (used for selling gold)."""
    return await _apply(user_id, delta_paise=paise_in, delta_mg=-mg_out)
