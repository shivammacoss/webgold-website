import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.client import Base
from app.utils.datetime_utils import utcnow


class FDStatus(str, Enum):
    ACTIVE = "ACTIVE"
    MATURED = "MATURED"
    BROKEN = "BROKEN"


class FDPlan(Base):
    __tablename__ = "fd_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    lock_in_days: Mapped[int] = mapped_column(Integer, nullable=False)
    apr_bps: Mapped[int] = mapped_column(Integer, nullable=False)
    min_grams_mg: Mapped[int] = mapped_column(BigInteger, default=100, nullable=False)


class GoldFD(Base):
    __tablename__ = "gold_fds"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fd_plans.id"), nullable=False
    )
    plan_name: Mapped[str] = mapped_column(String(120), nullable=False)
    principal_mg: Mapped[int] = mapped_column(BigInteger, nullable=False)
    apr_bps: Mapped[int] = mapped_column(Integer, nullable=False)
    lock_in_days: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    maturity_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default=FDStatus.ACTIVE.value, nullable=False, index=True
    )
    payout_mg: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    payout_tx_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
