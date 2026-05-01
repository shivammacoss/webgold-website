from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AdminUserRow(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: str | None
    referral_code: str
    is_admin: bool
    inr_balance: float | None
    gold_grams: float | None
    active_fds: int
    created_at: datetime


class AdminTransactionRow(BaseModel):
    id: str
    user_id: str
    user_email: EmailStr | None
    type: str
    amount_inr: float
    gold_grams: float
    rate_inr_per_gram: float | None
    status: str
    note: str | None
    created_at: datetime


class AdminFDRow(BaseModel):
    id: str
    user_id: str
    user_email: EmailStr | None
    plan_name: str
    principal_grams: float
    apr_pct: float
    lock_in_days: int
    start_date: datetime
    maturity_date: datetime
    status: str
    payout_grams: float | None


class AdminReferralRow(BaseModel):
    id: str
    referrer_email: EmailStr | None
    referee_email: EmailStr | None
    bonus_inr: float
    status: str
    created_at: datetime
    paid_at: datetime | None


class AdminStatsOut(BaseModel):
    total_users: int
    total_inr_locked: float
    total_gold_grams: float
    active_fds: int
    matured_fds: int
    total_referral_payout_inr: float


class AdminLoginLogRow(BaseModel):
    id: str
    user_id: str
    kind: str
    ip_address: str | None
    user_agent: str | None
    country: str | None
    region: str | None
    city: str | None
    lat: float | None
    lng: float | None
    geo_source: str | None
    accuracy_m: int | None
    created_at: datetime


class AdminFDPlanCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    lock_in_days: int = Field(gt=0, le=3650)
    apr_pct: float = Field(gt=0, le=100)
    min_grams: float = Field(gt=0)


class AdminFDPlanUpdateIn(BaseModel):
    """All fields optional — only the ones supplied will be updated."""
    name: str | None = Field(default=None, min_length=1, max_length=120)
    lock_in_days: int | None = Field(default=None, gt=0, le=3650)
    apr_pct: float | None = Field(default=None, gt=0, le=100)
    min_grams: float | None = Field(default=None, gt=0)
