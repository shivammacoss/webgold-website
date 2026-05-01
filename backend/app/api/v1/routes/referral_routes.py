from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user, get_session
from app.models.user import User
from app.repositories import user_repo
from app.schemas.referral_schema import ReferralEntry, ReferralListOut

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.get("", response_model=ReferralListOut)
async def my_referrals(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> ReferralListOut:
    refs = await user_repo.list_referrals_by_referrer(session, user.id)

    entries: list[ReferralEntry] = []
    total_paise = 0
    for r in refs:
        referee = await user_repo.get_user_by_id(session, r.referee_id)
        if not referee:
            continue
        entries.append(ReferralEntry(
            referee_email=referee.email,
            bonus_inr=r.bonus_paise / 100,
            status=r.status,
            created_at=r.created_at,
        ))
        total_paise += r.bonus_paise

    return ReferralListOut(
        code=user.referral_code,
        total_bonus_inr=total_paise / 100,
        referrals=entries,
    )
