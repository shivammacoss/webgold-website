"""FD start / break / payout business logic."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import BPS_DIVISOR, DAYS_PER_YEAR
from app.exceptions.custom_exceptions import (
    FDAlreadySettled,
    FDMinGramsViolation,
    FDNotFound,
    FDPlanNotFound,
)
from app.models.fd import FDStatus, GoldFD
from app.models.gold import Transaction, TxnType
from app.repositories import fd_repo, gold_repo
from app.schemas.fd_schema import FDOut, FDPlanOut, FDStartIn
from app.services.wallet_service import credit_gold, debit_gold


def compute_payout_mg(principal_mg: int, apr_bps: int, lock_in_days: int) -> int:
    """principal * (1 + apr * days/365), pure integer math."""
    interest_mg = (principal_mg * apr_bps * lock_in_days) // (BPS_DIVISOR * DAYS_PER_YEAR)
    return principal_mg + interest_mg


async def list_plans_out(session: AsyncSession) -> list[FDPlanOut]:
    rows = await fd_repo.list_plans(session)
    return [_plan_out(p) for p in rows]


async def list_user_fds_out(session: AsyncSession, user_id: str) -> list[FDOut]:
    rows = await fd_repo.list_fds_by_user(session, user_id)
    return [_fd_out(fd) for fd in rows]


async def start_fd(session: AsyncSession, user_id: str, payload: FDStartIn) -> FDOut:
    plan = await fd_repo.get_plan(session, payload.plan_id)
    if not plan:
        raise FDPlanNotFound()

    grams_mg = int(round(payload.grams * 1000))
    if grams_mg < plan.min_grams_mg:
        raise FDMinGramsViolation(f"minimum {plan.min_grams_mg / 1000} g required")

    await debit_gold(session, user_id, grams_mg)

    uid = uuid.UUID(user_id)
    now = datetime.now(timezone.utc)
    fd = GoldFD(
        user_id=uid,
        plan_id=plan.id,
        plan_name=plan.name,
        principal_mg=grams_mg,
        apr_bps=plan.apr_bps,
        lock_in_days=plan.lock_in_days,
        start_date=now,
        maturity_date=now + timedelta(days=plan.lock_in_days),
    )
    await fd_repo.insert_fd(session, fd)

    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=uid,
            type=TxnType.FD_LOCK.value,
            gold_mg=grams_mg,
            note=f"Locked in FD: {plan.name}",
        ),
    )

    return _fd_out(fd)


async def break_fd(session: AsyncSession, user_id: str, fd_id: str) -> FDOut:
    fd = await fd_repo.get_fd(session, fd_id)
    if not fd or str(fd.user_id) != user_id:
        raise FDNotFound()
    if fd.status != FDStatus.ACTIVE.value:
        raise FDAlreadySettled()

    # Early break: principal only, no interest.
    await credit_gold(session, user_id, fd.principal_mg)
    await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=fd.user_id,
            type=TxnType.FD_BREAK.value,
            gold_mg=fd.principal_mg,
            note=f"FD {fd.id} broken early — principal returned",
        ),
    )

    fd.status = FDStatus.BROKEN.value
    fd.payout_mg = fd.principal_mg
    await fd_repo.save_fd(session, fd)
    return _fd_out(fd)


# ---------- Projections ----------
def _plan_out(p) -> FDPlanOut:
    return FDPlanOut(
        id=str(p.id),
        name=p.name,
        lock_in_days=p.lock_in_days,
        apr_pct=p.apr_bps / 100,
        min_grams=p.min_grams_mg / 1000,
    )


def _fd_out(fd: GoldFD) -> FDOut:
    projected = compute_payout_mg(fd.principal_mg, fd.apr_bps, fd.lock_in_days)
    return FDOut(
        id=str(fd.id),
        plan_name=fd.plan_name,
        principal_grams=fd.principal_mg / 1000,
        apr_pct=fd.apr_bps / 100,
        lock_in_days=fd.lock_in_days,
        start_date=fd.start_date,
        maturity_date=fd.maturity_date,
        status=fd.status,
        payout_grams=(fd.payout_mg / 1000) if fd.payout_mg else None,
        projected_payout_grams=projected / 1000,
    )
