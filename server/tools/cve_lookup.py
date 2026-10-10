"""Defensive lookups against the NVD CVE API."""

from __future__ import annotations

import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv

_NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
_CVE_PATTERN = re.compile(r"^CVE-\d{4}-\d{4,}$", re.IGNORECASE)

load_dotenv()


def _request_nvd(params: dict[str, str]) -> tuple[dict[str, Any] | None, str | None]:
    headers: dict[str, str] = {}
    api_key = os.getenv("NVD_API_KEY")
    if api_key:
        headers["apiKey"] = api_key
    try:
        response = httpx.get(_NVD_URL, params=params, headers=headers, timeout=10.0)
        if response.status_code >= 400:
            return None, "The NVD service returned an error."
        payload = response.json()
        if not isinstance(payload, dict):
            return None, "The NVD service returned an invalid response."
        return payload, None
    except (httpx.HTTPError, ValueError, TypeError):
        return None, "The NVD service could not be reached or parsed."


def _cvss_summary(cve: dict[str, Any]) -> tuple[float | None, str | None]:
    metrics = cve.get("metrics", {})
    for key in ("cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        entries = metrics.get(key) or []
        if entries:
            metric = entries[0].get("cvssData", {})
            return metric.get("baseScore"), metric.get("baseSeverity")
    return None, None


def _risk_for_severity(severity: str | None) -> str:
    if severity in {"CRITICAL", "HIGH"}:
        return "high"
    if severity == "MEDIUM":
        return "med"
    return "low"


def _summarize_cve(cve: dict[str, Any]) -> dict[str, Any]:
    score, severity = _cvss_summary(cve)
    descriptions = cve.get("descriptions") or []
    description = next(
        (item.get("value") for item in descriptions if item.get("lang") == "en"),
        "No English description provided.",
    )
    return {
        "id": cve.get("id"),
        "published": cve.get("published"),
        "last_modified": cve.get("lastModified"),
        "description": description,
        "cvss_score": score,
        "severity": severity,
    }


def lookup_cve(cve_id: str) -> dict[str, Any]:
    """Look up one CVE by ID using the NVD API."""

    normalized = cve_id.strip().upper()
    if not _CVE_PATTERN.fullmatch(normalized):
        return {
            "tool": "lookup_cve",
            "risk": "low",
            "reason": "The supplied value is not a valid CVE identifier.",
            "details": {"cve_id": cve_id, "matches": []},
        }

    payload, error = _request_nvd({"cveId": normalized})
    if error:
        return {"tool": "lookup_cve", "risk": "med", "reason": error, "details": {"cve_id": normalized}}

    vulnerabilities = payload.get("vulnerabilities", []) if payload else []
    matches = [_summarize_cve(item.get("cve", {})) for item in vulnerabilities if item.get("cve")]
    severity = matches[0].get("severity") if matches else None
    return {
        "tool": "lookup_cve",
        "risk": _risk_for_severity(severity),
        "reason": "CVE found in NVD." if matches else "CVE was not found in NVD.",
        "details": {"cve_id": normalized, "matches": matches},
    }


def search_cves(keyword: str) -> dict[str, Any]:
    """Search NVD for CVEs matching a defensive keyword query."""

    normalized = keyword.strip()
    if not normalized:
        return {
            "tool": "search_cves",
            "risk": "low",
            "reason": "A non-empty keyword is required.",
            "details": {"keyword": keyword, "matches": []},
        }

    payload, error = _request_nvd({"keywordSearch": normalized, "resultsPerPage": "10"})
    if error:
        return {"tool": "search_cves", "risk": "med", "reason": error, "details": {"keyword": normalized}}

    vulnerabilities = payload.get("vulnerabilities", []) if payload else []
    matches = [_summarize_cve(item.get("cve", {})) for item in vulnerabilities if item.get("cve")]
    highest = "low"
    if any(item.get("severity") in {"CRITICAL", "HIGH"} for item in matches):
        highest = "high"
    elif any(item.get("severity") == "MEDIUM" for item in matches):
        highest = "med"
    return {
        "tool": "search_cves",
        "risk": highest,
        "reason": f"Found {len(matches)} matching CVE(s).",
        "details": {"keyword": normalized, "matches": matches},
    }
