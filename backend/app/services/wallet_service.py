"""Atomic wallet mutations + projections.

The repository implements the conditional UPDATE...RETURNING; this service
translates a "guard rejected" outcome into the domain `InsufficientBalance`
exception and exposes high-level helpers (credit, debit, swap).
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.custom_exceptions import InsufficientBalance
from app.models.user import Wallet
from app.repositories import user_repo
from app.schemas.wallet_schema import WalletOut


async def _apply(
    session: AsyncSession, user_id: str, *, delta_paise: int = 0, delta_mg: int = 0
) -> Wallet:
    wallet = await user_repo.apply_wallet_delta(
        session, user_id, delta_paise=delta_paise, delta_mg=delta_mg
    )
    if wallet is None:
        existing = await user_repo.get_wallet(session, user_id)
        if not existing:
            raise RuntimeError(f"wallet missing for user {user_id}")
        raise InsufficientBalance()
    return wallet


async def credit_inr(session: AsyncSession, user_id: str, paise: int) -> Wallet:
    return await _apply(session, user_id, delta_paise=paise)


async def debit_inr(session: AsyncSession, user_id: str, paise: int) -> Wallet:
    return await _apply(session, user_id, delta_paise=-paise)


async def credit_gold(session: AsyncSession, user_id: str, mg: int) -> Wallet:
    return await _apply(session, user_id, delta_mg=mg)


async def debit_gold(session: AsyncSession, user_id: str, mg: int) -> Wallet:
    return await _apply(session, user_id, delta_mg=-mg)


async def swap_inr_for_gold(
    session: AsyncSession, user_id: str, paise_out: int, mg_in: int
) -> Wallet:
    return await _apply(session, user_id, delta_paise=-paise_out, delta_mg=mg_in)


async def swap_gold_for_inr(
    session: AsyncSession, user_id: str, mg_out: int, paise_in: int
) -> Wallet:
    return await _apply(session, user_id, delta_paise=paise_in, delta_mg=-mg_out)


def to_wallet_out(w: Wallet) -> WalletOut:
    return WalletOut(
        inr_balance=w.inr_paise / 100,
        gold_grams=w.gold_mg / 1000,
        updated_at=w.updated_at,
    )
