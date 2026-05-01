from datetime import datetime

from pydantic import BaseModel, Field


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
