"""User / Wallet / Referral persistence — SQLAlchemy async, no business rules."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Referral, User, Wallet


def _to_uuid(user_id: str | uuid.UUID) -> uuid.UUID:
    return user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))


# ---------- User ----------
async def get_user_by_id(session: AsyncSession, user_id: str | uuid.UUID) -> User | None:
    try:
        uid = _to_uuid(user_id)
    except (ValueError, TypeError):
        return None
    return await session.scalar(select(User).where(User.id == uid))


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def get_user_by_referral_code(session: AsyncSession, code: str) -> User | None:
    return await session.scalar(select(User).where(User.referral_code == code))


async def insert_user(session: AsyncSession, user: User) -> User:
    session.add(user)
    await session.flush()
    return user


# ---------- Wallet ----------
async def get_wallet(session: AsyncSession, user_id: str | uuid.UUID) -> Wallet | None:
    return await session.scalar(
        select(Wallet).where(Wallet.user_id == _to_uuid(user_id))
    )


async def insert_wallet(session: AsyncSession, user_id: str | uuid.UUID) -> Wallet:
    w = Wallet(user_id=_to_uuid(user_id))
    session.add(w)
    await session.flush()
    return w


async def apply_wallet_delta(
    session: AsyncSession,
    user_id: str | uuid.UUID,
    *,
    delta_paise: int = 0,
    delta_mg: int = 0,
) -> Wallet | None:
    """Atomic balance change via UPDATE ... WHERE ... RETURNING.

    Returns the updated row, or None if the conditional guard rejected the
    update (= insufficient funds).
    """
    uid = _to_uuid(user_id)
    stmt = update(Wallet).where(Wallet.user_id == uid)
    if delta_paise < 0:
        stmt = stmt.where(Wallet.inr_paise >= -delta_paise)
    if delta_mg < 0:
        stmt = stmt.where(Wallet.gold_mg >= -delta_mg)

    stmt = stmt.values(
        inr_paise=Wallet.inr_paise + delta_paise,
        gold_mg=Wallet.gold_mg + delta_mg,
        updated_at=datetime.now(timezone.utc),
    ).returning(Wallet)

    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if row is not None:
        await session.refresh(row)
    return row


# ---------- Referral ----------
async def insert_referral(
    session: AsyncSession, referrer_id: str | uuid.UUID, referee_id: str | uuid.UUID
) -> Referral:
    r = Referral(referrer_id=_to_uuid(referrer_id), referee_id=_to_uuid(referee_id))
    session.add(r)
    await session.flush()
    return r


async def find_pending_referral_for_referee(
    session: AsyncSession, referee_id: str | uuid.UUID
) -> Referral | None:
    return await session.scalar(
        select(Referral).where(
            Referral.referee_id == _to_uuid(referee_id),
            Referral.status == "PENDING",
        )
    )


async def claim_pending_referral(
    session: AsyncSession, referral_id: uuid.UUID, bonus_paise: int
) -> bool:
    """Atomically flip PENDING → PAID. Returns True if this caller won the race."""
    stmt = (
        update(Referral)
        .where(Referral.id == referral_id, Referral.status == "PENDING")
        .values(
            status="PAID",
            bonus_paise=bonus_paise,
            paid_at=datetime.now(timezone.utc),
        )
        .returning(Referral.id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none() is not None


async def list_referrals_by_referrer(
    session: AsyncSession, referrer_id: str | uuid.UUID
) -> list[Referral]:
    res = await session.scalars(
        select(Referral)
        .where(Referral.referrer_id == _to_uuid(referrer_id))
        .order_by(desc(Referral.created_at))
    )
    return list(res.all())
