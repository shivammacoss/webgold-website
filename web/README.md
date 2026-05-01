# mysafeGold — frontends

Two Next.js 15 apps live here: a customer-facing app and an operator console.

| Folder | Purpose | Port |
|---|---|---|
| [user/](./user/) | Customer-facing wallet, portfolio, FDs | **3000** |
| [admin/](./admin/) | Operator console: users / transactions / FDs / gold | **3001** |

Both share the same look-and-feel (cream `#F5F1E8` on near-black `#0B0B0C`, gold accent `#E5B547`) and the same backend at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

## Run them in parallel

```bash
# terminal 1
cd user && pnpm install && pnpm dev   # http://localhost:3000

# terminal 2
cd admin && pnpm install && pnpm dev  # http://localhost:3001
```

Each app has its own `package.json`, lockfile, and config. Token storage keys differ (`msg_access` vs `msg_admin_access`) so the two apps can hold separate sessions in the same browser.

## Shared structure

Both follow the feature-based layout:

```
<app>/
├── app/                    # Next.js App Router
├── features/               # auth, gold, fd, wallet, ...
│   └── <name>/
│       ├── api/            # React Query hooks (one file per query/mutation)
│       ├── components/     # feature-specific components
│       ├── store/          # zustand stores (where applicable)
│       ├── hooks/
│       └── types.ts
├── components/
│   ├── ui/                 # Button, Input, Card (design system)
│   ├── layout/             # navbar / sidebar
│   └── common/             # cross-feature, e.g. SectionHero, Loader
├── lib/                    # api-client, query-client, utils, constants
├── providers/              # query / theme / root
├── hooks/
├── styles/                 # globals.css
├── three/                  # particles, scene
├── config/                 # site / env
└── types/
```

## Backend endpoints the admin app expects

The user app already works against the existing FastAPI backend.
The admin app additionally needs the following (mark them admin-only via a role claim or a separate `/admin/auth/*` flow):

| Endpoint | Returns | Used by |
|---|---|---|
| `GET /admin/stats` | Platform-wide aggregates (users, INR locked, gold held, active/matured FDs) | dashboard overview |
| `GET /admin/users` | All users (incl. wallet balances, active FD count) | `/users` |
| `GET /admin/transactions` | All ledger entries with `user_email` | `/transactions` |
| `GET /admin/fds` | All FDs with `user_email` | `/fds` |
| `GET /admin/referrals` | Referral rows with referrer/referee emails | `/referrals` |

Until those are added, the admin app will load the layout and chrome but the data tables will surface a 404 from the backend. Wire the endpoints, then the existing React Query hooks pick them up automatically.
