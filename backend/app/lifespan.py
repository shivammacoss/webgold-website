"""Startup / shutdown lifecycle for the FastAPI app."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db.client import close_engine, connect_engine
from app.db.init_db import init_db
from app.jobs.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_engine()
    await init_db()
    sched = start_scheduler()
    try:
        yield
    finally:
        sched.shutdown(wait=False)
        await close_engine()
