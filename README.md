# evewhoswho

![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

Dynamic EVE Online org chart editor/publisher with EVE SSO authentication, draft/publish workflow, deterministic SVG/PNG rendering, and append-only auditing.

## What this repo contains

- **Frontend**: public chart viewer + admin editor shell
- **Backend API**: config/auth/publish/chart artifact routes
- **Storage (no SQL)**: file-backed `DATA_DIR` with draft/published/snapshots/audit/cache
- **Validation**: JSON Schema + business-rule validation
- **Tests**: unit, integration, and e2e scaffolding

## Quick start

```bash
git clone <your-fork-or-origin-url>
cd evewhoswho
cp .env.example .env
docker compose up --build
```

Local dev without Docker:

```bash
cd app
npm install
npm run dev
```

App defaults to `http://localhost:3000`.

## Configuration

All variables are read by the Next.js app process.

| Variable | Required | Description |
| --- | --- | --- |
| `EVE_SSO_CLIENT_ID` | yes (for login) | EVE SSO OAuth client id. |
| `EVE_SSO_CLIENT_SECRET` | yes (for login) | EVE SSO OAuth client secret. |
| `EVE_SSO_CALLBACK_URL` | yes (for login) | Callback URL registered with EVE SSO (for example `http://localhost:3000/api/auth/callback`). |
| `SESSION_SECRET` | yes | Secret used to encrypt/sign session cookie payloads. |
| `DATA_DIR` | yes (recommended) | Persistent data directory storing drafts, published config, snapshots, render cache, and `audit.log`. |

### `DATA_DIR` contents

- `orgchart.draft.json` – active draft being edited.
- `orgchart.published.json` – last published config.
- `snapshots/*.json` – publish snapshots.
- `render-cache/chart.*` – rendered latest + immutable hash artifacts.
- `audit.log` – append-only JSONL audit stream.

## Core API surface

- `GET /chart` – public chart page
- `GET /api/chart.svg` – latest SVG
- `GET /api/chart.png` – latest PNG
- `GET /api/config` – config read (admin)
- `PUT /api/config` – config write (admin)
- `POST /api/publish` – publish transaction (admin)
- `GET /api/auth/login` – start EVE SSO
- `GET /api/auth/callback` – EVE SSO callback
- `GET /api/auth/session` – session status

## Publish transaction (`POST /api/publish`)

Publish executes these steps in order:

1. Validate draft (schema + business checks).
2. Snapshot draft into `DATA_DIR/snapshots`.
3. Promote draft to published.
4. Regenerate SVG/PNG render artifacts.
5. Append audit entry to `DATA_DIR/audit.log`.

Each audit entry contains actor, timestamp, config hash, and change summary.

## Original request status (what is still missing)

See [`docs/status-against-request.md`](docs/status-against-request.md) for a direct checklist against the original “Blades of Grass Org Chart Webapp” requirements.

## Docs

- [Installation guide](docs/installation.md)
- [Architecture overview](docs/architecture.md)
- [Contributing guide](docs/contributing.md)
- [Security policy](.github/SECURITY.md)
- [Request-status checklist](docs/status-against-request.md)

## Docker

Build and run with compose:

```bash
docker compose up --build
```

Or standalone:

```bash
docker build -t evewhoswho .
docker run --rm -p 3000:3000 --env-file .env -v ./data:/data evewhoswho
```
