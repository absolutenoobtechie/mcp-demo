# SecOps API contract

The local FastAPI bridge runs at `http://127.0.0.1:8000` and exposes the same
defensive functions as the stdio MCP server. Every tool response has this
shape:

```json
{
  "tool": "tool_name",
  "risk": "low",
  "reason": "Human-readable assessment.",
  "details": {}
}
```

`risk` is always one of `low`, `med`, or `high`. Passwords and detected secret
values are never returned.

## `GET /api/tools`

Returns the available tools and their input schemas.

Example response:

```json
{
  "tools": [
    {
      "name": "scan_secrets",
      "description": "Scan text for common API keys and tokens without returning values.",
      "input_schema": {
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
        "additionalProperties": false
      }
    }
  ]
}
```

The response includes all seven tools; the example is abbreviated.

## `POST /api/scan_secrets`

Request:

```json
{"text": "OPENAI_API_KEY=sk-aaaaaaaaaaaaaaaaaaaaaaaa"}
```

Example response:

```json
{
  "tool": "scan_secrets",
  "risk": "high",
  "reason": "Found 1 secret-like value(s); matched values are omitted.",
  "details": {
    "findings": [{"type": "openai_key", "risk": "high", "line": 1, "redacted": "[value omitted]"}],
    "count": 1,
    "scanned_characters": 42
  }
}
```

## `POST /api/lookup_cve`

Request:

```json
{"cve_id": "CVE-2024-3094"}
```

Example response:

```json
{
  "tool": "lookup_cve",
  "risk": "high",
  "reason": "CVE found in NVD.",
  "details": {
    "cve_id": "CVE-2024-3094",
    "matches": [{"id": "CVE-2024-3094", "severity": "HIGH", "cvss_score": 10.0}]
  }
}
```

## `POST /api/search_cves`

Request:

```json
{"keyword": "openssl ssh"}
```

Example response:

```json
{
  "tool": "search_cves",
  "risk": "med",
  "reason": "Found 1 matching CVE(s).",
  "details": {
    "keyword": "openssl ssh",
    "matches": [{"id": "CVE-2024-0001", "severity": "MEDIUM", "cvss_score": 5.3}]
  }
}
```

## `POST /api/analyze_auth_log`

Request:

```json
{"log_text": "sshd: Failed password for invalid user admin from 203.0.113.10 port 22 ssh2"}
```

Example response:

```json
{
  "tool": "analyze_auth_log",
  "risk": "med",
  "reason": "Authentication activity includes public source IP address(es).",
  "details": {
    "parsed_auth_lines": 1,
    "failed_attempts": 1,
    "successful_logins": 0,
    "brute_force_sources": [],
    "odd_ips": ["203.0.113.10"]
  }
}
```

## `POST /api/check_password_breach`

Request:

```json
{"password": "correct horse battery staple"}
```

Example response:

```json
{
  "tool": "check_password_breach",
  "risk": "low",
  "reason": "The password hash was not found in the returned breach data.",
  "details": {"breached": false, "occurrences": 0, "sha1_prefix": "ABCDE"}
}
```

The password is hashed locally. Only the first five SHA-1 characters are sent
to HIBP; the password itself is never logged or transmitted.

## `POST /api/score_url`

Request:

```json
{"url": "https://example.com/login"}
```

Example response:

```json
{
  "tool": "score_url",
  "risk": "low",
  "reason": "No notable phishing heuristics were detected.",
  "details": {
    "score": 0,
    "flags": [],
    "hostname": "example.com",
    "scheme": "https",
    "head_check": {"performed": false, "reason": "Heuristic-only check; no untrusted content was fetched."}
  }
}
```

This check intentionally performs no request to the supplied URL, which keeps
the demo from turning URL analysis into an SSRF primitive.

## `POST /api/generate_incident_report`

Aggregates prior structured tool outputs into a defensive incident summary.
The report copies only safe, aggregate signals from each finding and does not
include raw secret matches or passwords.

Request JSON:

```json
{
  "findings": [
    {
      "tool": "analyze_auth_log",
      "risk": "high",
      "reason": "Repeated authentication failures indicate possible brute-force activity.",
      "details": {
        "failed_attempts": 12,
        "brute_force_sources": ["203.0.113.44"]
      }
    },
    {
      "tool": "score_url",
      "risk": "low",
      "reason": "No phishing heuristics detected.",
      "details": {"score": 0, "hostname": "example.com"}
    }
  ]
}
```

Response JSON:

```json
{
  "tool": "generate_incident_report",
  "risk": "high",
  "reason": "Prioritized 2 finding(s); overall risk is high.",
  "details": {
    "overall_risk": "high",
    "finding_count": 2,
    "prioritized_findings": [
      {
        "priority": 1,
        "tool": "analyze_auth_log",
        "risk": "high",
        "reason": "Repeated authentication failures indicate possible brute-force activity.",
        "signals": {
          "failed_attempts": 12,
          "brute_force_sources": ["203.0.113.44"]
        }
      },
      {
        "priority": 2,
        "tool": "score_url",
        "risk": "low",
        "reason": "No phishing heuristics detected.",
        "signals": {"score": 0, "hostname": "example.com"}
      }
    ],
    "recommended_actions": [
      "Investigate source IPs and review authentication events; apply rate limiting and MFA where appropriate.",
      "Continue monitoring the remaining low-risk finding(s)."
    ],
    "ignored_inputs": 0
  }
}
```

## Errors

Unknown tools return `404`. Invalid or extra request fields return `422` with
FastAPI validation details. Upstream NVD and HIBP failures return a normal
structured tool response with `risk: "med"`; they do not expose exception text.
