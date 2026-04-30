"""APScheduler job that matures FDs and credits payouts to the user's gold wallet."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.models import FDStatus, GoldFD, Transaction, TxnType
from app.services.wallet import credit_gold

logger = logging.getLogger(__name__)


def compute_payout_mg(principal_mg: int, apr_bps: int, lock_in_days: int) -> int:
    """principal * (1 + apr * days/365), all in mg/bps integer math."""
    interest_mg = (principal_mg * apr_bps * lock_in_days) // (10_000 * 365)
    return principal_mg + interest_mg


async def mature_due_fds() -> int:
    now = datetime.now(timezone.utc)
    rows = await GoldFD.find(
        GoldFD.status == FDStatus.ACTIVE.value,
        GoldFD.maturity_date <= now,
    ).to_list()

    matured = 0
    for fd in rows:
        payout_mg = compute_payout_mg(fd.principal_mg, fd.apr_bps, fd.lock_in_days)

        # Atomic credit
        await credit_gold(fd.user_id, payout_mg)

        tx = Transaction(
            user_id=fd.user_id,
            type=TxnType.FD_PAYOUT.value,
            gold_mg=payout_mg,
            note=f"FD {fd.id} matured",
        )
        await tx.insert()

        fd.status = FDStatus.MATURED.value
        fd.payout_mg = payout_mg
        fd.payout_tx_id = str(tx.id)
        await fd.save()
        matured += 1

    if matured:
        logger.info("matured %d FDs", matured)
    return matured


async def _job() -> None:
    try:
        await mature_due_fds()
    except Exception:
        logger.exception("FD maturity job failed")


def start_scheduler() -> AsyncIOScheduler:
    sched = AsyncIOScheduler(timezone="UTC")
    sched.add_job(
        _job,
        "interval",
        minutes=15,
        id="fd_maturity",
        max_instances=1,
        next_run_time=datetime.now(timezone.utc),  # run once immediately at startup
    )
    sched.start()
    return sched
