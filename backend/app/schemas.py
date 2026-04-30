from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    phone: str | None = None
    referral_code: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: str | None
    referral_code: str
    created_at: datetime


# ---------- Gold ----------
class GoldRateOut(BaseModel):
    # Truth values — INR (the backend's storage unit).
    inr_per_gram: float
    buy_inr_per_gram: float
    sell_inr_per_gram: float
    # Convenience: USD (most-requested second currency)
    usd_per_gram: float
    buy_usd_per_gram: float
    sell_usd_per_gram: float
    usd_inr: float
    # Full FX map: { "USD": 94.82, "EUR": 111.0, "INR": 1.0, ... }
    # Each value is "INR per 1 unit of that currency". Clients divide INR amounts
    # by fx[ccy] to get the display value.
    fx: dict[str, float]
    fetched_at: datetime
    source: str


class GoldRatePoint(BaseModel):
    inr_per_gram: float
    fetched_at: datetime


# ---------- Wallet ----------
class WalletOut(BaseModel):
    inr_balance: float
    gold_grams: float
    updated_at: datetime


class AmountIn(BaseModel):
    amount_inr: float = Field(gt=0)


class GramsIn(BaseModel):
    grams: float = Field(gt=0)


class TransactionOut(BaseModel):
    id: str
    type: str
    amount_inr: float
    gold_grams: float
    rate_inr_per_gram: float | None
    status: str
    note: str | None
    created_at: datetime


# ---------- FD ----------
class FDPlanOut(BaseModel):
    id: str
    name: str
    lock_in_days: int
    apr_pct: float
    min_grams: float


class FDStartIn(BaseModel):
    plan_id: str
    grams: float = Field(gt=0)


class FDOut(BaseModel):
    id: str
    plan_name: str
    principal_grams: float
    apr_pct: float
    lock_in_days: int
    start_date: datetime
    maturity_date: datetime
    status: str
    payout_grams: float | None
    projected_payout_grams: float


# ---------- Portfolio ----------
class PortfolioOut(BaseModel):
    gold_grams: float
    inr_balance: float
    gold_value_inr: float
    invested_inr: float
    pnl_inr: float
    pnl_pct: float
    active_fds: int
    locked_grams: float


# ---------- Referrals ----------
class ReferralEntry(BaseModel):
    referee_email: EmailStr
    bonus_inr: float
    status: str
    created_at: datetime


class ReferralListOut(BaseModel):
    code: str
    total_bonus_inr: float
    referrals: list[ReferralEntry]
