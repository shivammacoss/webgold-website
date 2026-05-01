"""FD plan + GoldFD persistence."""
import uuid
from datetime import datetime

from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fd import FDPlan, FDStatus, GoldFD


def _to_uuid(value: str | uuid.UUID) -> uuid.UUID:
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))


# ---------- FDPlan ----------
async def list_plans(session: AsyncSession) -> list[FDPlan]:
    res = await session.scalars(select(FDPlan).order_by(asc(FDPlan.lock_in_days)))
    return list(res.all())


async def get_plan(session: AsyncSession, plan_id: str | uuid.UUID) -> FDPlan | None:
    try:
        pid = _to_uuid(plan_id)
    except (ValueError, TypeError):
        return None
    return await session.scalar(select(FDPlan).where(FDPlan.id == pid))


# ---------- GoldFD ----------
async def insert_fd(session: AsyncSession, fd: GoldFD) -> GoldFD:
    session.add(fd)
    await session.flush()
    return fd


async def get_fd(session: AsyncSession, fd_id: str | uuid.UUID) -> GoldFD | None:
    try:
        fid = _to_uuid(fd_id)
    except (ValueError, TypeError):
        return None
    return await session.scalar(select(GoldFD).where(GoldFD.id == fid))


async def list_fds_by_user(
    session: AsyncSession, user_id: str | uuid.UUID
) -> list[GoldFD]:
    res = await session.scalars(
        select(GoldFD)
        .where(GoldFD.user_id == _to_uuid(user_id))
        .order_by(desc(GoldFD.start_date))
    )
    return list(res.all())


async def list_active_fds_by_user(
    session: AsyncSession, user_id: str | uuid.UUID
) -> list[GoldFD]:
    res = await session.scalars(
        select(GoldFD).where(
            GoldFD.user_id == _to_uuid(user_id),
            GoldFD.status == FDStatus.ACTIVE.value,
        )
    )
    return list(res.all())


async def list_due_active_fds(session: AsyncSession, now: datetime) -> list[GoldFD]:
    res = await session.scalars(
        select(GoldFD).where(
            GoldFD.status == FDStatus.ACTIVE.value,
            GoldFD.maturity_date <= now,
        )
    )
    return list(res.all())


async def save_fd(session: AsyncSession, fd: GoldFD) -> GoldFD:
    await session.flush()
    return fd


# ---------- FDPlan mutations (admin) ----------
async def insert_plan(session: AsyncSession, plan: FDPlan) -> FDPlan:
    session.add(plan)
    await session.flush()
    return plan


async def save_plan(session: AsyncSession, plan: FDPlan) -> FDPlan:
    await session.flush()
    return plan


async def delete_plan(session: AsyncSession, plan: FDPlan) -> None:
    await session.delete(plan)
    await session.flush()


async def count_fds_for_plan(session: AsyncSession, plan_id: str | uuid.UUID) -> int:
    from sqlalchemy import func, select as _select
    res = await session.scalar(
        _select(func.count(GoldFD.id)).where(GoldFD.plan_id == _to_uuid(plan_id))
    )
    return int(res or 0)
