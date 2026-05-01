"""Audit-log persistence (login_logs)."""
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import LoginLog


def _to_uuid(v: str | uuid.UUID) -> uuid.UUID:
    return v if isinstance(v, uuid.UUID) else uuid.UUID(str(v))


async def insert_login_log(session: AsyncSession, log: LoginLog) -> LoginLog:
    session.add(log)
    await session.flush()
    return log


async def list_login_logs_for_user(
    session: AsyncSession, user_id: str | uuid.UUID, limit: int = 50
) -> list[LoginLog]:
    res = await session.scalars(
        select(LoginLog)
        .where(LoginLog.user_id == _to_uuid(user_id))
        .order_by(desc(LoginLog.created_at))
        .limit(limit)
    )
    return list(res.all())
