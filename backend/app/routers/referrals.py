from beanie import PydanticObjectId
from fastapi import APIRouter, Depends

from app.deps import current_user
from app.models import Referral, User
from app.schemas import ReferralEntry, ReferralListOut

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.get("", response_model=ReferralListOut)
async def my_referrals(user: User = Depends(current_user)) -> ReferralListOut:
    refs = await Referral.find(Referral.referrer_id == str(user.id)).sort("-created_at").to_list()

    entries: list[ReferralEntry] = []
    total_paise = 0
    for r in refs:
        try:
            referee = await User.get(PydanticObjectId(r.referee_id))
        except Exception:
            referee = None
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
