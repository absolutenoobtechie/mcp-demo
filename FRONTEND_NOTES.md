# Frontend Implementation Notes & Assumptions

This document describes the design, implementation decisions, and assumptions made for the **SecOps MCP Console** frontend (`/frontend`).

---

## 1. Architecture & Ownership Boundary

- **Ownership strictly respected**: Only files in `/frontend`, `FRONTEND_NOTES.md`, and the frontend running section in `README.md` were created/edited. `/server`, `/tests`, `API.md`, and `AGENTS.md` were left completely untouched.
- **Single API Layer**: All API communication, schema definitions, and network error handling live strictly in [`frontend/src/api.js`](file:///frontend/src/api.js). Any backend contract change touches only this file.
- **Base URL**: Configured via `import.meta.env.VITE_API_URL` with a default of `http://localhost:8000`. In addition, runtime custom URLs can be configured directly in the console UI via the Navbar Settings modal (stored in `localStorage`).

---

## 2. API Contract Conformance

The frontend strictly targets the API contract specified in `API.md`:

### Endpoints
- **`GET /api/tools`**: Fetches the list of defensive tools and their JSON schemas.
- **`POST /api/{tool_name}`**: Invokes the selected tool with payload `{ [fieldName]: value }`.

### Unified Response Shape
```json
{
  "tool": "tool_name",
  "risk": "low" | "med" | "high",
  "reason": "Human-readable assessment.",
  "details": { ... }
}
```

### Supported Defensive Tools (MCP)
1. **`scan_secrets(text)`**: Scans text for credentials (OpenAI, AWS, GitHub tokens, Slack, private keys). Redacts and omits matched secret values.
2. **`lookup_cve(cve_id)`**: Looks up vulnerability in NVD with CVSS base score and severity.
3. **`search_cves(keyword)`**: Searches NVD by defensive query keywords.
4. **`analyze_auth_log(log_text)`**: Parses authentication logs, flags brute-force sources (threshold ≥ 5 failed attempts), and highlights public/odd IPs.
5. **`check_password_breach(password)`**: Checks passwords using HIBP k-anonymity (sends only 5-character SHA-1 prefix). Passwords are never sent or logged.
6. **`score_url(url)`**: Heuristic phishing evaluation with zero outbound fetches (SSRF-safe).

---

## 3. Assumptions & Contract Clarifications

1. **Backend Availability & Offline Demo Readiness**:
   - *Assumption*: During a hackathon demo or local judge evaluation, the FastAPI bridge might not be running simultaneously or upstream services (NVD rate limits, HIBP connectivity) might experience latency or rate limits.
   - *Implementation*: `frontend/src/api.js` includes an intelligent **Dual-Mode Adapter**. It attempts live requests to `VITE_API_URL`, but if the server is unreachable or if the user clicks "Force Mock", it seamlessly executes a high-fidelity local adapter replicating the exact tool algorithms. The Navbar displays a clear status pill (`Connected: Live API` vs `Mock Adapter (Offline / Demo)`).

2. **CORS Configuration**:
   - `server/api.py` allows origin `http://localhost:5173`.
   - *Assumption*: The Vite dev server must run on port 5173 (`--port 5173 --host 127.0.0.1`). This is configured in `vite.config.js` and npm start scripts.

3. **Validation Error Handling**:
   - *Assumption*: FastAPI returns HTTP 422 with validation errors when unexpected or misspelled fields are passed (due to `extra="forbid"` on `StrictInput`).
   - *Implementation*: The frontend strictly constructs exact payload structures matching each tool's schema, avoiding extra fields.

4. **Privacy & k-Anonymity on the Client**:
   - *Assumption*: Even in mock mode, passwords must never be stored, logged, or sent in plaintext.
   - *Implementation*: The mock adapter uses the standard Web Crypto API (`crypto.subtle.digest("SHA-1", ...)`) directly in the user's browser, transmitting only the 5-character prefix.

5. **Sample Datasets Grounding**:
   - The "Load Sample" buttons in the UI are directly populated from `samples/auth.log` and `samples/dummy-secrets.txt`, providing instant 1-click proof for judges.

---

## 4. How to Run the Frontend

```powershell
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.
To point to a different API server:
```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000"
npm run dev
```
Or use the Settings button in the console header.
