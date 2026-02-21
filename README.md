# Thanx Take-Home Code Challenge

Loyalty rewards app: view balance, redeem rewards, top-up points; redemption history with pagination.  
Backend: Ruby on Rails (API + SQLite). Frontend: React (TypeScript) + MUI.

---

## Documentation — Setup and run

**Prerequisites:** Ruby 3.4.3 (or ≥3.4.3), Rails 8.0.2, Node.js 20+, SQLite3 (via Ruby gem).  
If Rails fails with a Prism/NameError (e.g. on snap Ruby), use Ruby 3.4.3 via rbenv or another installer.

Repo does not include `node_modules` or `frontend/dist`. After clone:

```bash
# Backend
cd backend && bundle install && ./bin/rails db:migrate && ./bin/rails db:seed

# Frontend (one-time build)
cd frontend && npm install && npm run build

# Run
cd backend && ./bin/rails server
```

Open **http://localhost:3000**. One server serves the app and API.

**Dev with hot reload:** run `./bin/rails server` in backend and `npm run start` in frontend; use **http://localhost:5173** (proxies `/api` to backend).

---

## API (JSON)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/:id/points` | Balance |
| POST | `/api/users/:id/points` | Add points |
| POST | `/api/topup` | Top-up `{ "user_id", "points" }` |
| GET | `/api/rewards` | List rewards |
| GET | `/api/users/:id/redemptions` | History |
| POST | `/api/users/:id/redemptions` | Redeem `{ "redemption": { "reward_id" } }` |

Errors: `{ "errors": ["message"] }`. Seed: user 1, 500 pts; four rewards.

---

## AI assistance

Cursor/LLM was used for: Frontend stying, Some Testing.
