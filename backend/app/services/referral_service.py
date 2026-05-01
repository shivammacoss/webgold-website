"""Referral bonus credit on first deposit."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.gold import Transaction, TxnType
from app.repositories import gold_repo, user_repo
from app.services.wallet_service import credit_inr

settings = get_settings()


async def credit_referral_if_eligible(session: AsyncSession, user_id: str) -> None:
    """Idempotent — fires only if the user was referred and the row is PENDING."""
    referral = await user_repo.find_pending_referral_for_referee(session, user_id)
    if not referral:
        return

    bonus = settings.referral_bonus_paise
    won = await user_repo.claim_pending_referral(session, referral.id, bonus)
    if not won:
        return  # another deposit already won the race

    for uid in (referral.referrer_id, referral.referee_id):
        await credit_inr(session, str(uid), bonus)
        await gold_repo.insert_transaction(
            session,
            Transaction(
                user_id=uid,
                type=TxnType.REFERRAL_BONUS.value,
                amount_paise=bonus,
                note="Referral bonus",
            ),
        )
