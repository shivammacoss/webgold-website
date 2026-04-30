"""Referral bonus credit on first deposit by a referee."""
from datetime import datetime, timezone

from app.config import get_settings
from app.models import Referral, Transaction, TxnType
from app.services.wallet import credit_inr

settings = get_settings()


async def credit_referral_if_eligible(user_id: str) -> None:
    """Called inside the deposit flow. Idempotent — only fires for the first
    deposit if the user was referred and the referral is still PENDING."""
    referral = await Referral.find_one(
        Referral.referee_id == user_id,
        Referral.status == "PENDING",
    )
    if not referral:
        return

    bonus = settings.referral_bonus_paise

    # Atomically mark PAID first to prevent double-credit on concurrent deposits.
    coll = Referral.get_pymongo_collection()
    res = await coll.find_one_and_update(
        {"_id": referral.id, "status": "PENDING"},
        {"$set": {
            "status": "PAID",
            "bonus_paise": bonus,
            "paid_at": datetime.now(timezone.utc),
        }},
    )
    if res is None:
        return  # another deposit already won the race

    for uid in (referral.referrer_id, referral.referee_id):
        await credit_inr(uid, bonus)
        await Transaction(
            user_id=uid,
            type=TxnType.REFERRAL_BONUS.value,
            amount_paise=bonus,
            note="Referral bonus",
        ).insert()
