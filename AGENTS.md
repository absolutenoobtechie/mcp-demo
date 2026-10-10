# SecOps MCP Server project guidance

## Goal

Build a demo-ready, defensive-only MCP server for AI + cybersecurity. Prefer
simple, readable code that can be demonstrated in under 24 hours.

## Stack

- Backend: Python 3.11+, official `mcp` SDK with FastMCP, `httpx`, and `pydantic`
- API bridge: FastAPI wrapping the same tool functions used by MCP
- Frontend: React + Vite + Tailwind in `/frontend`
- No database; in-memory or state files only

## Structure and tools

- `/server/main.py`: FastMCP stdio entrypoint
- `/server/api.py`: FastAPI bridge
- `/server/tools/secrets_scan.py`: scan text for API keys and tokens
- `/server/tools/cve_lookup.py`: NVD CVE lookup and keyword search
- `/server/tools/log_analyzer.py`: analyze authentication logs
- `/server/tools/breach_check.py`: HIBP k-anonymity password check
- `/server/tools/url_check.py`: heuristic phishing URL score
- `/tests`: pytest coverage
- `README.md`: setup and client connection instructions

The six MCP tools are `scan_secrets`, `lookup_cve`, `search_cves`,
`analyze_auth_log`, `check_password_breach`, and `score_url`.

Every tool must have typed arguments, a docstring, and a structured JSON result
with `tool`, `risk` (`low`, `med`, or `high`), `reason`, and `details` fields.

## Security rules

- Defensive analysis only. Do not add exploit, malware, credential theft, or attack tooling.
- Never log or store passwords or secrets.
- Hash passwords locally and send only the first five SHA-1 characters to HIBP.
- Keep credentials in `.env`; never commit `.env` or real credentials.
- Use a 10-second timeout for external API calls.
- Handle network errors and malformed upstream responses gracefully.
- Keep tool logic pure and testable; share it between MCP and FastAPI.

## Ownership

- Codex owns `/server`, `/tests`, setup files, and `README.md`/`API.md`.
- Antigravity owns `/frontend` only.
- Do not edit `/frontend` from backend work.
- Do not change the API contract without updating `API.md`.
