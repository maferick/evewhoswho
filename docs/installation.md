# Installation

This guide covers local development and containerized startup.

## Prerequisites

- **Option A (Docker):** Docker Engine + Docker Compose
- **Option B (Local runtime):** Node.js 20+
- EVE SSO application credentials if you need admin login

## 0) Ubuntu 24.04 one-command installer

If you are on Ubuntu 24.04, you can run the repository installer to set up prerequisites and app dependencies:

```bash
./install.sh
```

The script installs required apt packages, ensures Node.js 20.x is available, installs `app/` npm dependencies, creates `.env` from `.env.example` if missing, and creates `./data`.

## 1) Configure environment

Create a local env file (recommended for local Docker/CLI use):

```bash
cp .env.example .env
```

If you deploy via Portainer stacks, you can set the same variables in the stack environment instead of mounting/providing `.env`.

At minimum, set:

- `SESSION_SECRET` (required)
- `EVE_SSO_CLIENT_ID`, `EVE_SSO_CLIENT_SECRET`, `EVE_SSO_CALLBACK_URL` (required for login)
- `DATA_DIR` (recommended for predictable storage location)
- `SEAT_BASE_URL`, `SEAT_API_KEY` (required for SeAT Source Control test/sync)

## 2) Start the application

### Option A: Docker (recommended)

```bash
docker compose up --build
```

This maps `./data` on your host to `/data` in the container. Compose reads variables from `.env` via `env_file`, and Portainer can inject them from stack environment variables as well.

### Option B: Local Node.js runtime

```bash
cd app
npm install
npm run dev
```

By default, local runtime stores data under `app/data` unless `DATA_DIR` is set.

## 3) Verify key routes

- Public viewer: <http://localhost:3000/chart>
- Admin: <http://localhost:3000/admin>
- Session status: <http://localhost:3000/api/auth/session>
- SVG artifact: <http://localhost:3000/api/chart.svg>

## First-time admin access checklist

1. Log in once via `/admin` and complete EVE SSO callback.
2. For initial bootstrap, optionally set `BOOTSTRAP_ADMIN_CHARACTER_NAME` in `.env` to your EVE character name.
3. Add your EVE character ID to `permissions.adminCharacterIds` in the draft config file.
4. Reload `/admin`; you should now have edit/publish access.

## Persistent data notes

This project intentionally uses no SQL database.

Ensure `DATA_DIR` points to persistent storage in production so the following survive restarts:

- `orgchart.draft.json`
- `orgchart.published.json`
- `snapshots/*`
- `render-cache/*`
- `audit.log`

## Troubleshooting

- **"Missing required env var" errors:** verify `.env` values and restart the process/container.
- **Not admin after successful login:** confirm your character ID is in `permissions.adminCharacterIds`, or verify `BOOTSTRAP_ADMIN_CHARACTER_NAME` matches the exact logged-in character name.
- **Data disappears after restart:** ensure `DATA_DIR` is mounted to a persistent host volume.
