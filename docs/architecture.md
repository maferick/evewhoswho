# Architecture Overview

## Stack

- Next.js 14 App Router (TypeScript)
- File-backed storage (`DATA_DIR`) with no database
- EVE SSO auth + server-side allowlist authorization
- Server-side SVG/PNG chart generation

## Key modules

- `app/src/app/*` – pages + API routes
- `app/src/lib/config/*` – config loading, saving, validation
- `app/src/lib/auth/*` – EVE OAuth + session + admin guard
- `app/src/lib/render/*` – deterministic render pipeline
- `app/src/lib/audit/*` – append-only publish log
- `schemas/orgchart.schema.json` – canonical schema

## Data lifecycle

- Draft edits are stored in `orgchart.draft.json`
- Publish promotes draft to `orgchart.published.json`
- Each publish writes snapshot JSON + audit entry
- Render artifacts are cached under `render-cache/`

## Security model

- EVE SSO identifies character
- Session cookie stores signed auth state
- Admin endpoints check `permissions.adminCharacterIds`
- Public viewer routes remain unauthenticated

## Deployment model

- Single container deployment
- Persistent volume mounted to `DATA_DIR`
- Environment variables provide SSO + session secrets
