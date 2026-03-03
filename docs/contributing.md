# Contributing

## Development workflow

1. Create a feature branch from `main`.
2. Make focused changes with tests where possible.
3. Run local checks:
   ```bash
   cd app
   npm run typecheck
   npm run test
   ```
4. Open a pull request using the provided template.

## Commit style

Use short imperative summaries, for example:

- `docs: add install and architecture guides`
- `feat(auth): enforce admin allowlist on config writes`

## Project priorities

- Keep deterministic rendering behavior.
- Keep IDs stable in config examples/tests.
- Preserve no-SQL architecture.
- Favor small, reviewable PRs.
