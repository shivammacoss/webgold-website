import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel
from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.client import Base
from app.utils.datetime_utils import utcnow


class TxnType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAW = "WITHDRAW"
    BUY_GOLD = "BUY_GOLD"
    SELL_GOLD = "SELL_GOLD"
    FD_LOCK = "FD_LOCK"
    FD_PAYOUT = "FD_PAYOUT"
    FD_BREAK = "FD_BREAK"
    REFERRAL_BONUS = "REFERRAL_BONUS"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    amount_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    gold_mg: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    rate_paise_per_g: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="COMPLETED", nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


Index("ix_transactions_user_created", Transaction.user_id, Transaction.created_at.desc())


class GoldRateSnap(Base):
    __tablename__ = "gold_rate_snaps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paise_per_g: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )


# Internal value object (not a DB row)
class GoldRate(BaseModel):
    paise_per_g: int
    fetched_at: datetime
    source: str
    usd_inr: float | None = None
