# mysafeGold

A Jar / Gullak-style gold investment app: buy digital gold at the live market rate,
lock grams into a Gold FD that earns extra grams at maturity, and manage everything
from your in-app wallet.

**Three deliverables in one repo:**

| Folder | Stack | What it is |
|---|---|---|
| `backend/` | FastAPI + **PostgreSQL** (SQLAlchemy 2.x async + asyncpg) + APScheduler | Real REST API with JWT auth, live GoldAPI.io rates, atomic wallet UPDATEs, FD maturity cron |
| `web/user/`  | Next.js 15 + Tailwind + shadcn-style + Framer Motion | Customer-facing app, port **3000** |
| `web/admin/` | Next.js 15 + Tailwind | Operator console, port **3001** |
| `mobile/`  | Expo + Expo Router + NativeWind + Reanimated | iOS / Android app, same 5 tabs, same backend |

> **Money is simulated.** Wallet balances are real numbers in a real DB; "deposit" / "withdraw"
> are no-op state changes. No payment gateway, no KYC. Live gold rates are real, fetched from
> GoldAPI.io.

---

## Prerequisites

- **PostgreSQL 14+** (e.g. `brew install postgresql@16 && brew services start postgresql@16`)
- Python 3.11+
- Node 20+ and `pnpm` (or `npm`)
- A free [GoldAPI.io](https://www.goldapi.io) key (optional — fallback to Yahoo Finance, then a hardcoded rate)
- Expo Go app on your phone (for mobile testing)

## 1. Backend

```bash
cd backend
cp .env.example .env       # then edit DATABASE_URL, GOLD_API_KEY, etc.

# create the database
createdb mysafe_gold        # or: psql -c "CREATE DATABASE mysafe_gold;"

# install deps
python -m venv .venv && source .venv/bin/activate   # Windows: source .venv/Scripts/activate
pip install -e ".[dev]"

uvicorn app.main:app --reload
```

API is now at `http://localhost:8000` — try `GET /` and `GET /api/v1/gold/rate`.
On first start, the backend connects to Postgres, **creates all tables via
`Base.metadata.create_all()`**, and seeds three FD plans automatically. The FD
maturity job runs every 15 minutes (and once at startup) in the background.

> For production deployments, replace the `create_all()` step with Alembic
> migrations: `alembic init migrations`, autogenerate, then `alembic upgrade head`
> in your deploy pipeline.

Run tests:
```bash
pytest
```

`DATABASE_URL` format (asyncpg driver):
```
postgresql+asyncpg://USER:PASSWORD@HOST:5432/mysafe_gold
```

## 2. Web (user + admin)

Two independent Next.js apps under [web/](./web/):

```bash
# terminal 1 — customer app on port 3000
cd web/user && pnpm install && pnpm dev

# terminal 2 — admin console on port 3001
cd web/admin && pnpm install && pnpm dev
```

Default API URL is `http://localhost:8000` (override with `NEXT_PUBLIC_API_URL`).
See [web/README.md](./web/README.md) for layout details and the admin endpoint contract.

## 3. Mobile

```bash
cd mobile
pnpm install
pnpm start    # opens Expo dev tools; scan the QR with Expo Go
```

If running Expo Go on a real device, change `extra.apiUrl` in `app.json` from
`http://localhost:8000` to your machine's LAN IP (the app also auto-detects
the Metro host in dev — see `mobile/lib/api.ts`).

---

## End-to-end smoke flow

1. `POST /api/v1/auth/register` → returns JWT pair.
2. `GET /api/v1/gold/rate` → live INR/g + multi-currency FX map.
3. Web `/register` → land on `/home` → see the live rate animate in.
4. Wallet → Deposit ₹5000 → balance updates, transaction appears.
5. Home → Buy Gold ₹1000 → grams added to portfolio at the buy rate.
6. Home → Start FD with 0.5 g for 90 days → appears in Portfolio with countdown.
7. (Manual maturity test) In `psql`:
   ```sql
   UPDATE gold_fds SET maturity_date = NOW() WHERE status = 'ACTIVE' LIMIT 1;
   ```
   Wait ≤15 min for the cron — gold wallet credited, FD shows MATURED.
8. Open Expo Go on phone, log in with same creds → see same wallet + FDs.
9. Referrals → copy code → register a second user with that code → first deposit credits ₹50 to both wallets.

---

## Architecture notes

- **Money in paise (BIGINT), gold in milligrams (BIGINT)** at the DB layer. No floats anywhere
  near a balance — float drift is the #1 way fintechs lose customer money.
- **Atomic mutations**: the wallet ledger uses
  `UPDATE wallets SET ... WHERE user_id = :uid AND inr_paise + delta >= 0 RETURNING *`
  — if the WHERE clause rejects the row (insufficient funds), no update happens and the
  service raises `InsufficientBalance`. Standard fintech pattern; works correctly under
  Postgres' default `READ COMMITTED` isolation thanks to row-level locks during UPDATE.
- **Live rate caching**: GoldAPI's free tier is ~100 req/day. The backend caches the
  rate for 60s in-memory and persists a snapshot every 5 min to `gold_rate_snaps` for
  the history chart.
- **Visual system**: cream `#F5F1E8` on near-black `#0B0B0C` with gold accents `#E5B547`
  and a display serif (Fraunces). The `WordsPullUp` animation drives every section title
  — web with Framer Motion, mobile with Reanimated.
