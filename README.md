# evewhoswho

Dynamic EVE Online org chart editor/publisher with EVE SSO authentication, draft/publish workflow, artifact rendering, and append-only auditing.

## Quick start

```bash
cd app
npm install
npm run dev
```

App defaults to `http://localhost:3000`.

## Environment variables

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

## Publish transaction (`POST /api/publish`)

Publish executes these steps in order:

1. Validate draft (schema + business checks).
2. Snapshot draft into `DATA_DIR/snapshots`.
3. Promote draft to published.
4. Regenerate SVG/PNG render artifacts.
5. Append audit entry to `DATA_DIR/audit.log`.

Each audit entry contains actor, timestamp, config hash, and change summary.

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

