from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class WalletOut(BaseModel):
    inr_balance: float
    gold_grams: float
    updated_at: datetime


class TransactionOut(BaseModel):
    id: str
    type: str
    amount_inr: float
    gold_grams: float
    rate_inr_per_gram: float | None
    status: str
    note: str | None
    created_at: datetime


PaymentMethod = Literal["MANUAL", "UPI", "CARD", "BANK_TRANSFER", "RAZORPAY"]


class DepositIn(BaseModel):
    """Manual / dev-mode deposit (no gateway). For Razorpay use the dedicated
    /wallet/deposit/razorpay/* routes."""
    amount_inr: float = Field(gt=0)
    method: PaymentMethod = "MANUAL"
    method_ref: str | None = Field(default=None, max_length=64)


# ---------- Razorpay (Orders / Checkout) ----------
class RazorpayOrderIn(BaseModel):
    amount_inr: float = Field(gt=0)


class RazorpayOrderOut(BaseModel):
    """What the frontend needs to launch Razorpay Checkout."""
    order_id: str
    amount: int   # paise (Razorpay's unit)
    currency: str
    key_id: str   # public — safe to ship to the client
    receipt: str


class RazorpayVerifyIn(BaseModel):
    """Posted by the frontend after Razorpay's onSuccess fires."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount_inr: float = Field(gt=0)


# ---------- Withdraw (with destination details for RazorpayX-style payout) ----------
WithdrawMethod = Literal["UPI", "BANK_TRANSFER"]


class WithdrawIn(BaseModel):
    amount_inr: float = Field(gt=0)
    method: WithdrawMethod = "UPI"
    # UPI destination
    upi_id: str | None = Field(default=None, max_length=64)
    # Bank destination (NEFT/IMPS via RazorpayX in prod)
    account_holder: str | None = Field(default=None, max_length=120)
    account_number: str | None = Field(default=None, max_length=32)
    ifsc: str | None = Field(default=None, max_length=11)
