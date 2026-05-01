from pydantic import BaseModel


class PortfolioOut(BaseModel):
    gold_grams: float
    inr_balance: float
    gold_value_inr: float
    invested_inr: float
    pnl_inr: float
    pnl_pct: float
    active_fds: int
    locked_grams: float
