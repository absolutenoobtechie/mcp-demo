"""Aggregate prior defensive findings into a prioritized incident report."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Literal

Risk = Literal["low", "med", "high"]

_RISK_RANK: dict[str, int] = {"low": 0, "med": 1, "high": 2}


def _risk(value: Any) -> Risk:
    return value if value in _RISK_RANK else "low"


def _safe_signals(tool: str, details: Any) -> dict[str, Any]:
    """Keep useful aggregate signals while never copying arbitrary detail values."""

    if not isinstance(details, Mapping):
        return {}

    allowed = {
        "count",
        "scanned_characters",
        "breached",
        "occurrences",
        "score",
        "flags",
        "hostname",
        "scheme",
        "failed_attempts",
        "successful_logins",
        "brute_force_sources",
        "odd_ips",
        "cve_id",
        "keyword",
    }
    signals = {key: details[key] for key in allowed if key in details}

    matches = details.get("matches")
    if isinstance(matches, list):
        safe_matches = []
        for match in matches:
            if not isinstance(match, Mapping):
                continue
            safe_match = {
                key: match[key]
                for key in ("id", "severity", "cvss_score")
                if key in match
            }
            if safe_match:
                safe_matches.append(safe_match)
        signals["matches"] = safe_matches
        signals["match_count"] = len(matches)

    # Secret scanning findings are represented only by their count and risk;
    # never copy arbitrary match objects or values into the report.
    if tool == "scan_secrets":
        signals.pop("matches", None)

    return signals


def _actions_for(tool: str, risk: Risk) -> list[str]:
    if tool == "scan_secrets":
        return [
            "Revoke or rotate any exposed credentials and remove them from source/configuration.",
            "Review access logs for use of the affected credentials and move secrets to a secure vault.",
        ]
    if tool in {"lookup_cve", "search_cves"}:
        return [
            "Inventory affected versions and prioritize vendor patches or mitigations, especially for internet-facing assets.",
            "Confirm remediation with a follow-up vulnerability scan.",
        ]
    if tool == "analyze_auth_log":
        return [
            "Investigate the flagged source IPs and review surrounding authentication events.",
            "Apply rate limiting, lockout controls, and MFA where appropriate.",
        ]
    if tool == "check_password_breach":
        return [
            "Reset the affected password and require a unique replacement with MFA where available.",
        ]
    if tool == "score_url":
        return [
            "Do not visit the flagged URL; block or report it and investigate the delivery path.",
        ]
    if risk == "high":
        return ["Triage the high-risk finding immediately and preserve relevant evidence."]
    return ["Review the finding and collect additional defensive evidence."]


def generate_incident_report(findings: list[dict[str, Any]]) -> dict[str, Any]:
    """Prioritize prior tool outputs and recommend defensive response actions.

    The input is treated as untrusted report data. The output includes only
    allowlisted aggregate signals, so arbitrary secret values are not copied
    into the incident report.
    """

    normalized: list[dict[str, Any]] = []
    ignored_inputs = 0
    for item in findings:
        if not isinstance(item, Mapping):
            ignored_inputs += 1
            continue
        tool = str(item.get("tool") or "unknown_tool")
        item_risk = _risk(item.get("risk"))
        normalized.append(
            {
                "tool": tool,
                "risk": item_risk,
                "reason": str(item.get("reason") or "No reason was provided."),
                "signals": _safe_signals(tool, item.get("details")),
            }
        )

    normalized.sort(key=lambda item: (-_RISK_RANK[item["risk"]], item["tool"]))
    prioritized = [
        {"priority": index, **item} for index, item in enumerate(normalized, start=1)
    ]

    overall_risk: Risk = "low"
    if normalized:
        overall_risk = max(normalized, key=lambda item: _RISK_RANK[item["risk"]])["risk"]

    actions: list[str] = []
    for item in prioritized:
        for action in _actions_for(item["tool"], item["risk"]):
            if action not in actions:
                actions.append(action)

    if not actions:
        actions.append("No findings were supplied; continue monitoring and collect defensive telemetry.")

    ignored_note = f" Ignored {ignored_inputs} malformed input(s)." if ignored_inputs else ""
    reason = (
        f"Prioritized {len(prioritized)} defensive finding(s); highest observed risk is {overall_risk}."
        if prioritized
        else "No valid defensive findings were supplied."
    ) + ignored_note

    return {
        "tool": "generate_incident_report",
        "risk": overall_risk,
        "reason": reason,
        "details": {
            "overall_risk": overall_risk,
            "finding_count": len(prioritized),
            "prioritized_findings": prioritized,
            "recommended_actions": actions,
            "ignored_inputs": ignored_inputs,
        },
    }
