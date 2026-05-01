"""Maps domain exceptions to HTTP responses so route code stays clean."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions.custom_exceptions import (
    AmountTooSmall,
    AppError,
    EmailAlreadyRegistered,
    FDAlreadySettled,
    FDMinGramsViolation,
    FDNotFound,
    FDPlanNotFound,
    InsufficientBalance,
    InvalidCredentials,
    InvalidReferralCode,
)

_STATUS_MAP: dict[type[AppError], int] = {
    InvalidCredentials: 401,
    EmailAlreadyRegistered: 400,
    InvalidReferralCode: 400,
    InsufficientBalance: 400,
    AmountTooSmall: 400,
    FDPlanNotFound: 404,
    FDNotFound: 404,
    FDAlreadySettled: 400,
    FDMinGramsViolation: 400,
}

_DEFAULT_DETAIL: dict[type[AppError], str] = {
    InvalidCredentials: "invalid credentials",
    EmailAlreadyRegistered: "email already registered",
    InvalidReferralCode: "invalid referral code",
    InsufficientBalance: "insufficient balance",
    AmountTooSmall: "amount too small",
    FDPlanNotFound: "FD plan not found",
    FDNotFound: "FD not found",
    FDAlreadySettled: "FD already settled",
    FDMinGramsViolation: "minimum grams not met",
}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        status = _STATUS_MAP.get(type(exc), 400)
        detail = str(exc) or _DEFAULT_DETAIL.get(type(exc), "request failed")
        return JSONResponse(status_code=status, content={"detail": detail})
