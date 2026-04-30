# mysafeGold

A Jar / Gullak-style gold investment app: buy digital gold at the live market rate,
lock grams into a Gold FD that earns extra grams at maturity, and manage everything
from your in-app wallet.

**Three deliverables in one repo:**

| Folder | Stack | What it is |
|---|---|---|
| `backend/` | FastAPI + MongoDB (Beanie/Motor) + APScheduler | Real REST API with JWT auth, live GoldAPI.io rates, atomic `$inc` wallet ops, FD maturity cron |
| `web/`     | Next.js 15 + Tailwind + shadcn-style + Prisma hero | Responsive web app (5 sections: Home / Portfolio / Wallet / Referrals / Settings) |
| `mobile/`  | Expo + Expo Router + NativeWind + Reanimated | iOS / Android app, same 5 tabs, same backend |

> **Money is simulated.** Wallet balances are real numbers in a real DB; "deposit" / "withdraw"
> are no-op state changes. No payment gateway, no KYC. Live gold rates are real, fetched from
> GoldAPI.io.

---

## Prerequisites

- MongoDB Community 7+ (`brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`)
- Python 3.11+
- Node 20+ and `pnpm` (or `npm`)
- A free [GoldAPI.io](https://www.goldapi.io) key (optional — there's a fallback rate)
- Expo Go app on your phone (for mobile testing)

## 1. Backend

```bash
cd backend
cp .env.example .env       # then edit GOLD_API_KEY etc.
brew services start mongodb-community   # if not already running
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

API is now at `http://localhost:8000` — try `GET /` and `GET /gold/rate`.
On first start, the backend connects to Mongo, registers Beanie documents,
and seeds three FD plans automatically. The FD maturity job runs every 15
minutes (and once at startup) in the background.

Run tests:
```bash
pytest
```

## 2. Web

```bash
cd web
pnpm install
pnpm dev      # http://localhost:3000
```

- `/` shows the Prisma-style landing hero.
- `/signup` and `/login` create / restore a session.
- `/home`, `/portfolio`, `/wallet`, `/referrals`, `/settings` are the 5 sections.

Default API URL is `http://localhost:8000` (override with `NEXT_PUBLIC_API_URL`).

## 3. Mobile

```bash
cd mobile
pnpm install
pnpm start    # opens Expo dev tools; scan the QR with Expo Go
```

If running Expo Go on a real device, change `extra.apiUrl` in `app.json` from
`http://localhost:8000` to your machine's LAN IP (e.g. `http://192.168.1.7:8000`),
otherwise the phone can't reach the dev backend.

---

## End-to-end smoke flow

1. `POST /auth/register` → returns JWT pair.
2. `GET /gold/rate` → returns live INR/g (or fallback if GoldAPI key isn't set).
3. Web `/signup` → land on `/home` → see the live rate animate in.
4. Wallet → Deposit ₹5000 → balance updates, transaction appears.
5. Home → Buy Gold ₹1000 → grams added to portfolio at the buy rate.
6. Home → Start FD with 0.5 g for 90 days → appears in Portfolio with countdown.
7. (Manual maturity test) In `mongosh`: `use mysafe_gold; db.gold_fds.updateOne({}, {$set:{maturity_date: new Date()}})`
   Wait ≤15 min for the cron — wallet credited, FD shows MATURED.
8. Open Expo Go on phone, log in with same creds → see same wallet + FDs.
9. Referrals → copy code → register a second user with that code → first deposit credits ₹50 to both wallets.

---

## Architecture notes

- **Money in paise (int), gold in milligrams (int)** at the DB layer. No floats anywhere
  near a balance — float drift is the #1 way fintechs lose customer money.
- **Atomic mutations**: wallet/FD endpoints use Mongo's atomic `$inc` with conditional
  guards (`inr_paise: { $gte: amount }`) so concurrent buy/withdraw can't double-spend.
  Standard fintech pattern — no transactions or row locks required.
- **Live rate caching**: GoldAPI's free tier is ~100 req/day. The backend caches the
  rate for 60s in-memory and persists a snapshot every 5 min for the history chart.
- **Visual system**: cream `#E1E0CC` on near-black `#0A0A0A` with a noise overlay and
  display serif. The Prisma hero is dropped in verbatim on `/`, and the same
  `WordsPullUp` animation drives every section title — web with Framer Motion, mobile
  with Reanimated.
