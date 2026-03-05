# evewhoswho

![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

Dynamic EVE Online org chart editor/publisher with EVE SSO authentication, a draft→publish workflow, deterministic SVG/PNG rendering, and append-only auditing.

## Overview

This repository contains a single Next.js 14 app with two main user surfaces:

- **Public viewer (`/chart`)**: serves the latest published chart information and artifacts.
- **Admin editor (`/admin`)**: gated by EVE SSO + allowlist, used to edit draft JSON, validate, and publish.

There is **no SQL database**. Persistent state is stored in files under `DATA_DIR`.

## Features

- EVE SSO login flow (`/api/auth/login`, `/api/auth/callback`, `/api/auth/session`)
- Admin allowlist enforcement via `permissions.adminCharacterIds`
- JSON Schema + business-rule validation for org chart config
- Draft, published, snapshot, and audit file lifecycle
- Deterministic SVG/PNG render generation with on-disk cache
- Unit, integration, and e2e test suites

## Repository layout

```text
.
├── app/                      # Next.js application
│   ├── src/app/              # Pages + API routes
│   ├── src/lib/              # Auth, config, render, audit helpers
│   └── tests/                # unit/integration/e2e tests
├── docs/                     # Human documentation
├── schemas/                  # JSON schema definitions
├── docker-compose.yml
└── Dockerfile
```

## Quick start

### 1) Clone and configure

```bash
git clone https://github.com/maferick/evewhoswho.git
cd evewhoswho
./install.sh
```

The installer targets Ubuntu 24.04, installs system/runtime prerequisites, bootstraps dependencies to latest stable releases (`npm-check-updates`, clean install), enforces `npm audit --audit-level=high`, verifies `npm run build`, runs `npm ci` for deterministic installs, and creates `.env` from `.env.example` if needed.

Fill in `.env` values (especially EVE SSO + `SESSION_SECRET`).

### 2) Run with Docker (recommended)

```bash
docker compose up --build
```

`docker-compose.yml` supports both `.env` (`env_file`) and Compose/Portainer stack environment variables.

Open:

- Public chart: <http://localhost:3000/chart>
- Admin page: <http://localhost:3000/admin>

### 3) Run without Docker (Node.js 20+)

```bash
cd app
npm ci
npm run dev
```

If you run from `app/`, the app defaults `DATA_DIR` to `app/data` unless overridden.


For CI and local parity, use deterministic dependency installation and the security/build gate:

```bash
cd app
npm ci
npm run ci
```

## Environment variables

All variables are read by the Next.js process.

| Variable | Required | Description |
| --- | --- | --- |
| `EVE_SSO_CLIENT_ID` | Yes (for login) | EVE SSO OAuth client id. |
| `EVE_SSO_CLIENT_SECRET` | Yes (for login) | EVE SSO OAuth client secret. |
| `EVE_SSO_CALLBACK_URL` | Yes (for login) | OAuth callback URL registered with EVE SSO (example: `http://localhost:3000/api/auth/callback`). |
| `SESSION_SECRET` | Yes | Secret used to encrypt/sign session cookie payloads. |
| `BOOTSTRAP_ADMIN_CHARACTER_NAME` | Optional | Bootstrap admin character name. If it matches the logged-in EVE character name (case-insensitive), admin access is allowed even before `permissions.adminCharacterIds` is configured. |
| `DATA_DIR` | Recommended | Data directory for drafts, published config, snapshots, render cache, and `audit.log`. |

### `DATA_DIR` contents

- `orgchart.draft.json` — active editable draft
- `orgchart.published.json` — latest published config
- `snapshots/*.json` — immutable publish snapshots
- `render-cache/chart.*` — latest and hash-addressed render artifacts
- `audit.log` — append-only JSONL publish audit trail

## Admin workflow

1. Visit `/admin`.
2. Authenticate with EVE SSO.
3. (Optional bootstrap) Set `BOOTSTRAP_ADMIN_CHARACTER_NAME` to your exact EVE character name in `.env` for first-time access.
4. Ensure your character ID is listed in `permissions.adminCharacterIds` for long-term allowlist control.
5. Edit draft JSON and click **Save & Validate Draft**.
6. Click **Publish** to snapshot, promote, render artifacts, and append audit log entry.

## Core API surface

- `GET /chart` — public chart page
- `GET /api/chart.svg` — latest SVG artifact
- `GET /api/chart.png` — latest PNG artifact
- `GET /api/config` — read draft config (admin)
- `PUT /api/config` — save/validate draft config (admin)
- `POST /api/publish` — publish transaction (admin)
- `GET /api/auth/login` — start EVE SSO login
- `GET /api/auth/callback` — EVE SSO callback
- `GET /api/auth/session` — session status

## Development

```bash
cd app
npm install
npm run typecheck
npm run test
```

See [docs/contributing.md](docs/contributing.md) for branch and commit expectations.

## Additional docs

- [Installation guide](docs/installation.md)
- [Architecture overview](docs/architecture.md)
- [Contributing guide](docs/contributing.md)
- [Request-status checklist](docs/status-against-request.md)

## Docker usage

Build and run with compose:

```bash
docker compose up --build
```

Compose loads `.env` automatically and also allows overriding variables from the shell/stack environment (for example in Portainer).

Or standalone:

```bash
docker build -t evewhoswho .
docker run --rm -p 3000:3000 --env-file .env -v ./data:/data evewhoswho
```

## License

MIT. See [LICENSE](LICENSE).
