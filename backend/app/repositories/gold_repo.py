"""Transaction + GoldRateSnap persistence."""
import uuid
from datetime import datetime

from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gold import GoldRateSnap, Transaction


def _to_uuid(user_id: str | uuid.UUID) -> uuid.UUID:
    return user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))


# ---------- Transaction ----------
async def insert_transaction(session: AsyncSession, tx: Transaction) -> Transaction:
    session.add(tx)
    await session.flush()
    return tx


async def list_transactions(
    session: AsyncSession, user_id: str | uuid.UUID, limit: int = 100
) -> list[Transaction]:
    res = await session.scalars(
        select(Transaction)
        .where(Transaction.user_id == _to_uuid(user_id))
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    return list(res.all())


async def sum_amount_paise(
    session: AsyncSession, user_id: str | uuid.UUID, txn_type: str
) -> int:
    total = await session.scalar(
        select(func.coalesce(func.sum(Transaction.amount_paise), 0))
        .where(Transaction.user_id == _to_uuid(user_id), Transaction.type == txn_type)
    )
    return int(total or 0)


# ---------- GoldRateSnap ----------
async def insert_rate_snap(
    session: AsyncSession, paise_per_g: int, source: str, fetched_at: datetime
) -> None:
    session.add(GoldRateSnap(paise_per_g=paise_per_g, source=source, fetched_at=fetched_at))
    await session.flush()


async def list_rate_snaps_since(
    session: AsyncSession, since: datetime
) -> list[GoldRateSnap]:
    res = await session.scalars(
        select(GoldRateSnap)
        .where(GoldRateSnap.fetched_at >= since)
        .order_by(asc(GoldRateSnap.fetched_at))
    )
    return list(res.all())
