# Thanx Take-Home Code Challenge

Loyalty rewards app: view balance, browse rewards, redeem rewards, and add points (top-up).  
Backend: Ruby (standalone API + SQLite). Frontend: React (TypeScript) with Material UI.

---

## Prerequisites

- **Ruby** 3.x (for backend)
- **Node.js** 20+ or 22+ (for frontend)
- **SQLite3** (used via Ruby gem; no separate install required)

---

## Project structure

```
├── backend/           # API server (Ruby)
│   ├── standalone_api.rb   # HTTP server + all endpoint handlers
│   ├── db/
│   │   ├── init.sql         # Schema + seed data
│   │   └── development.sqlite3   # Created on first run
│   └── Gemfile
├── frontend/          # Web UI (React + TypeScript + MUI)
│   ├── src/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts   # Proxies /api to backend
└── README.md
```

---

## Setup and run

### 1. Backend

From the project root:

```bash
cd backend
```

**One-time: create database and seed data**

```bash
ruby -e "require 'sqlite3'; d = SQLite3::Database.new('db/development.sqlite3'); d.execute_batch(File.read('db/init.sql')); puts 'DB ready.'"
```

**Install gems (if you use Bundler)**

```bash
bundle install
```

The standalone server uses only the `sqlite3` gem; if `sqlite3` is installed globally, you can skip `bundle install`.

**Start the API server**

```bash
ruby standalone_api.rb
```

You should see: `API http://0.0.0.0:3000`  
Leave this terminal open. The API runs on **http://localhost:3000**.

---

### 2. Frontend

Open a **second terminal**. From the project root:

```bash
cd frontend
npm install
npm run start
```

When ready you should see the dev server at **http://localhost:5173**.

---

### 3. Use the app

1. Start the **backend** first, then the **frontend**.
2. In a browser, open **http://localhost:5173**.
3. Use the UI to view balance, redeem rewards, and click **+500 points** to top up.  
   Top-up requests are logged in the backend terminal (e.g. `[topup] user_id=1 added=500 ...`).

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/:id/points` | Get user's points balance |
| POST | `/api/users/:id/points` | Add points (body: `{ "points": 500 }`) |
| POST | `/api/topup` | Add points (body: `{ "user_id": 1, "points": 500 }`) — used by the +500 button |
| GET | `/api/rewards` | List all rewards |
| GET | `/api/users/:id/redemptions` | List user's redemption history |
| POST | `/api/users/:id/redemptions` | Redeem a reward (body: `{ "redemption": { "reward_id": 1 } }`) |

All responses are JSON. Errors use `{ "errors": ["message"] }`.

---

## Quick reference

| Task | Command |
|------|--------|
| Create/reset DB + seed | `cd backend && ruby -e "require 'sqlite3'; d = SQLite3::Database.new('db/development.sqlite3'); d.execute_batch(File.read('db/init.sql'))"` |
| Start backend | `cd backend && ruby standalone_api.rb` |
| Start frontend | `cd frontend && npm run start` |
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:5173 |

Seed data: one user (id 1, “Demo User”, 500 points) and four rewards (e.g. Free Coffee 100 pts, $5 Off 250 pts).
