# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security vulnerabilities.

Instead, contact repository maintainers privately and include:

- Impacted component/path
- Reproduction steps
- Potential impact
- Suggested remediation (if known)

## Security expectations

- Keep `SESSION_SECRET` strong and private.
- Never commit real EVE SSO client secrets.
- Restrict callback URLs to approved origins.
- Keep persistent `DATA_DIR` access limited to runtime service accounts.
