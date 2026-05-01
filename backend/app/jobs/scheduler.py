"""APScheduler bootstrap — registers all background jobs."""
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.constants import FD_MATURITY_INTERVAL_MIN
from app.jobs.fd_maturity_job import run_safely as fd_maturity_run


def start_scheduler() -> AsyncIOScheduler:
    sched = AsyncIOScheduler(timezone="UTC")
    sched.add_job(
        fd_maturity_run,
        "interval",
        minutes=FD_MATURITY_INTERVAL_MIN,
        id="fd_maturity",
        max_instances=1,
        next_run_time=datetime.now(timezone.utc),  # run once immediately at startup
    )
    sched.start()
    return sched
