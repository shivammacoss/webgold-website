from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user
from app.models import FDPlan, FDStatus, GoldFD, Transaction, TxnType, User
from app.schemas import FDOut, FDPlanOut, FDStartIn
from app.services.fd_scheduler import compute_payout_mg
from app.services.wallet import (
    InsufficientBalance,
    credit_gold,
    debit_gold,
)

router = APIRouter(prefix="/fd", tags=["fd"])


def _plan_out(p: FDPlan) -> FDPlanOut:
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


@router.get("/plans", response_model=list[FDPlanOut])
async def list_plans() -> list[FDPlanOut]:
    rows = await FDPlan.find_all().sort("+lock_in_days").to_list()
    return [_plan_out(p) for p in rows]


@router.get("", response_model=list[FDOut])
async def list_user_fds(user: User = Depends(current_user)) -> list[FDOut]:
    rows = await GoldFD.find(GoldFD.user_id == str(user.id)).sort("-start_date").to_list()
    return [_fd_out(fd) for fd in rows]


@router.post("/start", response_model=FDOut)
async def start_fd(payload: FDStartIn, user: User = Depends(current_user)) -> FDOut:
    try:
        plan = await FDPlan.get(PydanticObjectId(payload.plan_id))
    except Exception:
        raise HTTPException(400, "invalid plan id")
    if not plan:
        raise HTTPException(404, "FD plan not found")

    grams_mg = int(round(payload.grams * 1000))
    if grams_mg < plan.min_grams_mg:
        raise HTTPException(400, f"minimum {plan.min_grams_mg / 1000} g required")

    try:
        await debit_gold(str(user.id), grams_mg)
    except InsufficientBalance:
        raise HTTPException(400, "insufficient gold balance")

    now = datetime.now(timezone.utc)
    fd = GoldFD(
        user_id=str(user.id),
        plan_id=str(plan.id),
        plan_name=plan.name,
        principal_mg=grams_mg,
        apr_bps=plan.apr_bps,
        lock_in_days=plan.lock_in_days,
        start_date=now,
        maturity_date=now + timedelta(days=plan.lock_in_days),
    )
    await fd.insert()

    await Transaction(
        user_id=str(user.id),
        type=TxnType.FD_LOCK.value,
        gold_mg=grams_mg,
        note=f"Locked in FD: {plan.name}",
    ).insert()

    return _fd_out(fd)


@router.post("/{fd_id}/break", response_model=FDOut)
async def break_fd(fd_id: str, user: User = Depends(current_user)) -> FDOut:
    try:
        fd = await GoldFD.get(PydanticObjectId(fd_id))
    except Exception:
        raise HTTPException(400, "invalid FD id")
    if not fd or fd.user_id != str(user.id):
        raise HTTPException(404, "FD not found")
    if fd.status != FDStatus.ACTIVE.value:
        raise HTTPException(400, "FD already settled")

    # Early break: return principal only, no interest.
    await credit_gold(str(user.id), fd.principal_mg)
    await Transaction(
        user_id=str(user.id),
        type=TxnType.FD_BREAK.value,
        gold_mg=fd.principal_mg,
        note=f"FD {fd.id} broken early — principal returned",
    ).insert()

    fd.status = FDStatus.BROKEN.value
    fd.payout_mg = fd.principal_mg
    await fd.save()
    return _fd_out(fd)
