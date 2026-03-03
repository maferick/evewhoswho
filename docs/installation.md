# Installation

## Prerequisites

- Docker + Docker Compose **or** Node.js 20+
- An EVE SSO application (for admin login)

## Option A: Docker (recommended)

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Fill in EVE SSO credentials in `.env`.
3. Start the stack:
   ```bash
   docker compose up --build
   ```
4. Open `http://localhost:3000`.

## Option B: Local Node.js runtime

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Create data directory:
   ```bash
   mkdir -p data
   ```
3. Install and run:
   ```bash
   cd app
   npm install
   DATA_DIR=../data npm run dev
   ```

## Verify basic routes

- Public viewer: `GET /chart`
- SVG artifact: `GET /api/chart.svg`
- Session status: `GET /api/auth/session`

## Persistent data notes

This project intentionally uses no SQL. Ensure `DATA_DIR` is mapped to persistent storage in production so draft/published configs, snapshots, and `audit.log` survive container restarts.
