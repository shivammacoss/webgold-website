"""Combines every v1 route under /api/v1."""
from fastapi import APIRouter

from app.api.v1.routes import (
    admin_routes,
    audit_routes,
    auth_routes,
    fd_routes,
    gold_routes,
    invest_routes,
    portfolio_routes,
    referral_routes,
    user_routes,
    wallet_routes,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(gold_routes.router)
api_router.include_router(wallet_routes.router)
api_router.include_router(invest_routes.router)
api_router.include_router(fd_routes.router)
api_router.include_router(portfolio_routes.router)
api_router.include_router(referral_routes.router)
api_router.include_router(audit_routes.router)
api_router.include_router(admin_routes.router)
