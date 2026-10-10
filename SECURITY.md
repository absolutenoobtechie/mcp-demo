# Security Policy

## Defensive Scope & Guarantees

SecOps MCP is an open-source, defensive-only security intelligence service. It is designed specifically to give AI agents safe analytical capabilities without exposing infrastructure to risk:

1. **Zero Secret Logging & Persistence**: Secret scanning identifies patterns locally and redacts matched tokens immediately. Values are never stored, logged, or exposed in output details.
2. **k-Anonymity for Breach Audits**: Password checks use Have I Been Pwned's range API. Only the first 5 characters of a locally generated SHA-1 hash are sent. Passwords are never sent over the network or persisted.
3. **SSRF Safe**: Phishing URL scoring is strictly heuristic (evaluating scheme, domain structure, punycode, and TLD indicators). It performs no outbound HTTP requests to untrusted target domains.
4. **Enforced Timeouts**: All external upstream queries (such as NVD API) enforce strict 10-second request timeouts.
5. **No Offensive Capabilities**: Exploitation, brute-force simulation, payload delivery, and credential-stuffing tools are explicitly prohibited in this repository.

## Reporting Security Issues

If you discover a security issue or vulnerability within this project:

- **Do NOT** open a public issue.
- Please report vulnerabilities privately by emailing the maintainer: **satyamagarwalla7@gmail.com** or via [GitHub Private Vulnerability Reporting](https://github.com/absolutenoobtechie/mcp-demo/security/advisories/new).
- Please provide:
  - Description of the vulnerability and attack vector.
  - Minimal reproducible example or steps to reproduce.
  - Potential impact on AI agent environments.

We take all disclosures seriously and aim to acknowledge and investigate reports within 48 hours.
