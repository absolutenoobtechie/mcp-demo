"""Detect likely credentials without returning their values."""

from __future__ import annotations

import re
from typing import Any, Literal

Risk = Literal["low", "med", "high"]

_PATTERNS: tuple[tuple[str, re.Pattern[str], Risk], ...] = (
    ("private_key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"), "high"),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "high"),
    ("github_token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b"), "high"),
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"), "high"),
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"), "high"),
    ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"), "high"),
    (
        "generic_secret_assignment",
        re.compile(
            r"(?i)\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|secret[_-]?key)"
            r"\s*[:=]\s*['\"]?([A-Za-z0-9_./+=-]{16,})"
        ),
        "med",
    ),
)


def _line_number(text: str, position: int) -> int:
    return text.count("\n", 0, position) + 1


def scan_secrets(text: str) -> dict[str, Any]:
    """Scan text for common API keys and tokens without exposing matches."""

    findings: list[dict[str, Any]] = []
    for finding_type, pattern, finding_risk in _PATTERNS:
        for match in pattern.finditer(text):
            findings.append(
                {
                    "type": finding_type,
                    "risk": finding_risk,
                    "line": _line_number(text, match.start()),
                    "redacted": "[value omitted]",
                }
            )

    highest_risk: Risk = "low"
    if any(item["risk"] == "high" for item in findings):
        highest_risk = "high"
    elif findings:
        highest_risk = "med"

    reason = (
        f"Found {len(findings)} secret-like value(s); matched values are omitted."
        if findings
        else "No supported secret-like patterns were detected."
    )
    return {
        "tool": "scan_secrets",
        "risk": highest_risk,
        "reason": reason,
        "details": {
            "findings": findings,
            "count": len(findings),
            "scanned_characters": len(text),
        },
    }
