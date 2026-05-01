from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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
    # Each value is "INR per 1 unit of that currency".
    fx: dict[str, float]
    fetched_at: datetime
    source: str


class GoldRatePoint(BaseModel):
    inr_per_gram: float
    fetched_at: datetime


class AmountIn(BaseModel):
    amount_inr: float = Field(gt=0)


class GramsIn(BaseModel):
    grams: float = Field(gt=0)


PaymentMethod = Literal["MANUAL", "UPI", "CARD", "BANK_TRANSFER"]


class BuyGoldIn(BaseModel):
    """Direct-payment gold purchase — pays through a method, no wallet INR debit."""
    amount_inr: float = Field(gt=0)
    method: PaymentMethod = "MANUAL"
    method_ref: str | None = Field(default=None, max_length=64)


# ---------- Razorpay (buy-gold flow) ----------
class BuyGoldRazorpayOrderIn(BaseModel):
    amount_inr: float = Field(gt=0)


class BuyGoldRazorpayOrderOut(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    receipt: str


class BuyGoldRazorpayVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount_inr: float = Field(gt=0)
