---
name: Feature Request
about: Suggest a defensive tool or enhancement for SecOps MCP
title: "[FEAT] "
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Example: "AI agents cannot easily verify..."

**Proposed Defensive Solution**
A clear and concise description of the defensive tool, endpoint, or feature you would like to see added.

**Defensive & Privacy Considerations**
- Does this tool avoid offensive capabilities (e.g., no exploit execution)?
- Does this avoid storing or logging sensitive data?
- Does it prevent SSRF or untrusted outbound HTTP requests?

**Expected Input / Output Structure**
```json
// Proposed Input
{}

// Proposed Output
{
  "tool": "...",
  "risk": "low" | "med" | "high",
  "reason": "...",
  "details": {}
}
```

**Additional context**
Add any other context, API references, or screenshots about the feature request here.
