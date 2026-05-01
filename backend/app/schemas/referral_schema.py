from datetime import datetime

from pydantic import BaseModel, EmailStr


class ReferralEntry(BaseModel):
    referee_email: EmailStr
    bonus_inr: float
    status: str
    created_at: datetime


class ReferralListOut(BaseModel):
    code: str
    total_bonus_inr: float
    referrals: list[ReferralEntry]
