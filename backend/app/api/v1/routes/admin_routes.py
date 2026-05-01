"""Admin-only endpoints. Every route gates on `current_admin` (is_admin=True)."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.api.deps import current_admin, get_session
from app.models.fd import FDPlan, FDStatus, GoldFD
from app.models.gold import Transaction, TxnType
from app.models.user import Referral, User, Wallet
from app.repositories import audit_repo, fd_repo, user_repo
from app.schemas.admin_schema import (
    AdminFDPlanCreateIn,
    AdminFDPlanUpdateIn,
    AdminFDRow,
    AdminLoginLogRow,
    AdminReferralRow,
    AdminStatsOut,
    AdminTransactionRow,
    AdminUserRow,
)
from app.schemas.auth_schema import TokenPair
from app.schemas.fd_schema import FDPlanOut
from app.services import auth_service

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(current_admin)],
)


@router.get("/stats", response_model=AdminStatsOut)
async def stats(session: AsyncSession = Depends(get_session)) -> AdminStatsOut:
    total_users = await session.scalar(select(func.count(User.id))) or 0
    total_inr_paise = await session.scalar(
        select(func.coalesce(func.sum(Wallet.inr_paise), 0))
    ) or 0
    total_gold_mg = await session.scalar(
        select(func.coalesce(func.sum(Wallet.gold_mg), 0))
    ) or 0
    locked_gold_mg = await session.scalar(
        select(func.coalesce(func.sum(GoldFD.principal_mg), 0))
        .where(GoldFD.status == FDStatus.ACTIVE.value)
    ) or 0
    active_fds = await session.scalar(
        select(func.count(GoldFD.id)).where(GoldFD.status == FDStatus.ACTIVE.value)
    ) or 0
    matured_fds = await session.scalar(
        select(func.count(GoldFD.id)).where(GoldFD.status == FDStatus.MATURED.value)
    ) or 0
    referral_payout = await session.scalar(
        select(func.coalesce(func.sum(Referral.bonus_paise), 0))
        .where(Referral.status == "PAID")
    ) or 0

    return AdminStatsOut(
        total_users=int(total_users),
        total_inr_locked=int(total_inr_paise) / 100,
        total_gold_grams=(int(total_gold_mg) + int(locked_gold_mg)) / 1000,
        active_fds=int(active_fds),
        matured_fds=int(matured_fds),
        total_referral_payout_inr=int(referral_payout) / 100,
    )


@router.get("/users", response_model=list[AdminUserRow])
async def list_users(session: AsyncSession = Depends(get_session)) -> list[AdminUserRow]:
    active_count = (
        select(func.count(GoldFD.id))
        .where(
            GoldFD.user_id == User.id,
            GoldFD.status == FDStatus.ACTIVE.value,
        )
        .correlate(User)
        .scalar_subquery()
    )

    stmt = (
        select(User, Wallet, active_count.label("active_fds"))
        .outerjoin(Wallet, Wallet.user_id == User.id)
        .order_by(desc(User.created_at))
    )
    result = await session.execute(stmt)

    out: list[AdminUserRow] = []
    for user, wallet, active_fds in result.all():
        out.append(AdminUserRow(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            referral_code=user.referral_code,
            is_admin=getattr(user, "is_admin", False),
            inr_balance=(wallet.inr_paise / 100) if wallet else None,
            gold_grams=(wallet.gold_mg / 1000) if wallet else None,
            active_fds=int(active_fds or 0),
            created_at=user.created_at,
        ))
    return out


@router.get("/transactions", response_model=list[AdminTransactionRow])
async def list_transactions(
    limit: int = 500,
    session: AsyncSession = Depends(get_session),
) -> list[AdminTransactionRow]:
    stmt = (
        select(Transaction, User.email)
        .outerjoin(User, User.id == Transaction.user_id)
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    result = await session.execute(stmt)

    return [
        AdminTransactionRow(
            id=str(t.id),
            user_id=str(t.user_id),
            user_email=email,
            type=t.type,
            amount_inr=t.amount_paise / 100,
            gold_grams=t.gold_mg / 1000,
            rate_inr_per_gram=(t.rate_paise_per_g / 100) if t.rate_paise_per_g else None,
            status=t.status,
            note=t.note,
            created_at=t.created_at,
        )
        for t, email in result.all()
    ]


@router.get("/fds", response_model=list[AdminFDRow])
async def list_fds(session: AsyncSession = Depends(get_session)) -> list[AdminFDRow]:
    stmt = (
        select(GoldFD, User.email)
        .outerjoin(User, User.id == GoldFD.user_id)
        .order_by(desc(GoldFD.start_date))
    )
    result = await session.execute(stmt)

    return [
        AdminFDRow(
            id=str(fd.id),
            user_id=str(fd.user_id),
            user_email=email,
            plan_name=fd.plan_name,
            principal_grams=fd.principal_mg / 1000,
            apr_pct=fd.apr_bps / 100,
            lock_in_days=fd.lock_in_days,
            start_date=fd.start_date,
            maturity_date=fd.maturity_date,
            status=fd.status,
            payout_grams=(fd.payout_mg / 1000) if fd.payout_mg else None,
        )
        for fd, email in result.all()
    ]


@router.get("/referrals", response_model=list[AdminReferralRow])
async def list_referrals(
    session: AsyncSession = Depends(get_session),
) -> list[AdminReferralRow]:
    Referrer = aliased(User)
    Referee = aliased(User)
    stmt = (
        select(Referral, Referrer.email, Referee.email)
        .outerjoin(Referrer, Referrer.id == Referral.referrer_id)
        .outerjoin(Referee, Referee.id == Referral.referee_id)
        .order_by(desc(Referral.created_at))
    )
    result = await session.execute(stmt)

    return [
        AdminReferralRow(
            id=str(r.id),
            referrer_email=referrer_email,
            referee_email=referee_email,
            bonus_inr=r.bonus_paise / 100,
            status=r.status,
            created_at=r.created_at,
            paid_at=r.paid_at,
        )
        for r, referrer_email, referee_email in result.all()
    ]


@router.get("/users/{user_id}/logs", response_model=list[AdminLoginLogRow])
async def list_user_logs(
    user_id: str,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
) -> list[AdminLoginLogRow]:
    """Login audit trail for a single user — IP, user-agent, geo (best-effort)."""
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(400, "invalid user id")

    rows = await audit_repo.list_login_logs_for_user(session, user_id, limit=limit)
    return [
        AdminLoginLogRow(
            id=str(r.id),
            user_id=str(r.user_id),
            kind=getattr(r, "kind", "LOGIN") or "LOGIN",
            ip_address=r.ip_address,
            user_agent=r.user_agent,
            country=r.country,
            region=r.region,
            city=r.city,
            lat=r.lat,
            lng=r.lng,
            geo_source=getattr(r, "geo_source", None),
            accuracy_m=getattr(r, "accuracy_m", None),
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/users/{user_id}/impersonate", response_model=TokenPair)
async def impersonate_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
) -> TokenPair:
    """Mint a fresh access+refresh token pair for the target user.
    Only an authenticated admin (gated by `current_admin` on this router) can call this.
    The user app's /auth-bridge page consumes the returned tokens."""
    try:
        target = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(400, "invalid user id")

    user = await user_repo.get_user_by_id(session, target)
    if not user:
        raise HTTPException(404, "user not found")

    return await auth_service.issue_impersonation_tokens(session, user.id)


# ---------- FD plans (admin-only CRUD) ----------
def _plan_out(p: FDPlan) -> FDPlanOut:
    return FDPlanOut(
        id=str(p.id),
        name=p.name,
        lock_in_days=p.lock_in_days,
        apr_pct=p.apr_bps / 100,
        min_grams=p.min_grams_mg / 1000,
    )


@router.post("/fd-plans", response_model=FDPlanOut, status_code=201)
async def create_fd_plan(
    payload: AdminFDPlanCreateIn,
    session: AsyncSession = Depends(get_session),
) -> FDPlanOut:
    plan = FDPlan(
        name=payload.name,
        lock_in_days=payload.lock_in_days,
        apr_bps=int(round(payload.apr_pct * 100)),
        min_grams_mg=int(round(payload.min_grams * 1000)),
    )
    await fd_repo.insert_plan(session, plan)
    return _plan_out(plan)


@router.patch("/fd-plans/{plan_id}", response_model=FDPlanOut)
async def update_fd_plan(
    plan_id: str,
    payload: AdminFDPlanUpdateIn,
    session: AsyncSession = Depends(get_session),
) -> FDPlanOut:
    plan = await fd_repo.get_plan(session, plan_id)
    if not plan:
        raise HTTPException(404, "plan not found")

    if payload.name is not None:
        plan.name = payload.name
    if payload.lock_in_days is not None:
        plan.lock_in_days = payload.lock_in_days
    if payload.apr_pct is not None:
        plan.apr_bps = int(round(payload.apr_pct * 100))
    if payload.min_grams is not None:
        plan.min_grams_mg = int(round(payload.min_grams * 1000))

    await fd_repo.save_plan(session, plan)
    return _plan_out(plan)


@router.delete("/fd-plans/{plan_id}", status_code=204)
async def delete_fd_plan(
    plan_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    plan = await fd_repo.get_plan(session, plan_id)
    if not plan:
        raise HTTPException(404, "plan not found")

    in_use = await fd_repo.count_fds_for_plan(session, plan.id)
    if in_use > 0:
        raise HTTPException(
            400, f"cannot delete — {in_use} existing FD(s) still reference this plan"
        )

    await fd_repo.delete_plan(session, plan)
