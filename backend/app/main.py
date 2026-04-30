import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.routers import auth, fd, gold, invest, portfolio, referrals, wallet
from app.services.fd_scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    sched = start_scheduler()
    try:
        yield
    finally:
        sched.shutdown(wait=False)


app = FastAPI(title="mysafeGold API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(gold.router)
app.include_router(wallet.router)
app.include_router(invest.router)
app.include_router(fd.router)
app.include_router(portfolio.router)
app.include_router(referrals.router)


@app.get("/")
def health() -> dict:
    return {"status": "ok", "app": "mysafeGold", "db": "mongodb"}
