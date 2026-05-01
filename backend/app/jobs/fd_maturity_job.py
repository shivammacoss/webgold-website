"""Mature ACTIVE FDs whose maturity_date has passed — credits payout to gold wallet."""
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.client import session_scope
from app.models.fd import FDStatus
from app.models.gold import Transaction, TxnType
from app.repositories import fd_repo, gold_repo
from app.services.fd_service import compute_payout_mg
from app.services.wallet_service import credit_gold

logger = logging.getLogger(__name__)


async def _mature_one(session: AsyncSession, fd) -> None:
    payout_mg = compute_payout_mg(fd.principal_mg, fd.apr_bps, fd.lock_in_days)
    await credit_gold(session, str(fd.user_id), payout_mg)

    tx = await gold_repo.insert_transaction(
        session,
        Transaction(
            user_id=fd.user_id,
            type=TxnType.FD_PAYOUT.value,
            gold_mg=payout_mg,
            note=f"FD {fd.id} matured",
        ),
    )

    fd.status = FDStatus.MATURED.value
    fd.payout_mg = payout_mg
    fd.payout_tx_id = tx.id
    await fd_repo.save_fd(session, fd)


async def mature_due_fds() -> int:
    """Runs in its own session/transaction (background job — not request-scoped)."""
    matured = 0
    async for session in session_scope():
        now = datetime.now(timezone.utc)
        rows = await fd_repo.list_due_active_fds(session, now)
        for fd in rows:
            await _mature_one(session, fd)
            matured += 1

    if matured:
        logger.info("matured %d FDs", matured)
    return matured


async def run_safely() -> None:
    try:
        await mature_due_fds()
    except Exception:
        logger.exception("FD maturity job failed")
