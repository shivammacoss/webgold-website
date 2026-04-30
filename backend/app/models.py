"""Beanie document models for mysafeGold.

Money is stored in paise (int) and gold in milligrams (int) at the DB layer.
Wallet mutations use atomic $inc with conditional filters — see services/wallet.py.
"""
from datetime import datetime, timezone
from enum import Enum

from beanie import Document, Indexed
from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TxnType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAW = "WITHDRAW"
    BUY_GOLD = "BUY_GOLD"
    SELL_GOLD = "SELL_GOLD"
    FD_LOCK = "FD_LOCK"
    FD_PAYOUT = "FD_PAYOUT"
    FD_BREAK = "FD_BREAK"
    REFERRAL_BONUS = "REFERRAL_BONUS"


class FDStatus(str, Enum):
    ACTIVE = "ACTIVE"
    MATURED = "MATURED"
    BROKEN = "BROKEN"


class User(Document):
    email: Indexed(str, unique=True)               # type: ignore[valid-type]
    password_hash: str
    full_name: str
    phone: str | None = None
    referral_code: Indexed(str, unique=True)        # type: ignore[valid-type]
    referred_by_id: str | None = None              # str(ObjectId) of referrer
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"


class Wallet(Document):
    user_id: Indexed(str, unique=True)              # type: ignore[valid-type]
    inr_paise: int = 0
    gold_mg: int = 0
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "wallets"


class Transaction(Document):
    user_id: Indexed(str)                            # type: ignore[valid-type]
    type: str
    amount_paise: int = 0
    gold_mg: int = 0
    rate_paise_per_g: int | None = None
    status: str = "COMPLETED"
    note: str | None = None
    created_at: Indexed(datetime) = Field(default_factory=utcnow)  # type: ignore[valid-type]

    class Settings:
        name = "transactions"


class FDPlan(Document):
    name: str
    lock_in_days: int
    apr_bps: int                  # 700 bps = 7.00%
    min_grams_mg: int = 100       # in milligrams

    class Settings:
        name = "fd_plans"


class GoldFD(Document):
    user_id: Indexed(str)                            # type: ignore[valid-type]
    plan_id: str
    plan_name: str
    principal_mg: int
    apr_bps: int
    lock_in_days: int
    start_date: datetime = Field(default_factory=utcnow)
    maturity_date: datetime
    status: str = FDStatus.ACTIVE.value
    payout_mg: int | None = None
    payout_tx_id: str | None = None

    class Settings:
        name = "gold_fds"


class GoldRateSnap(Document):
    paise_per_g: int
    source: str
    fetched_at: Indexed(datetime) = Field(default_factory=utcnow)  # type: ignore[valid-type]

    class Settings:
        name = "gold_rate_snaps"


class Referral(Document):
    referrer_id: Indexed(str)                        # type: ignore[valid-type]
    referee_id: Indexed(str, unique=True)            # type: ignore[valid-type]
    bonus_paise: int = 0
    status: str = "PENDING"
    created_at: datetime = Field(default_factory=utcnow)
    paid_at: datetime | None = None

    class Settings:
        name = "referrals"


# ---------- Internal value objects (not Documents) ----------
class GoldRate(BaseModel):
    paise_per_g: int
    fetched_at: datetime
    source: str
    # Optional USD/INR FX rate from the same fetch — populated by the Yahoo path,
    # absent when goldapi.io is the source. Clients use this to render USD prices
    # without making their own FX call.
    usd_inr: float | None = None
