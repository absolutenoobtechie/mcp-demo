"""Local, heuristic phishing URL scoring with no content fetches."""

from __future__ import annotations

import ipaddress
from typing import Any
from urllib.parse import urlparse

_SHORTENER_HOSTS = {
    "bit.ly",
    "goo.gl",
    "is.gd",
    "ow.ly",
    "rb.gy",
    "t.co",
    "tinyurl.com",
}
_SUSPICIOUS_TLDS = {".zip", ".mov", ".click", ".country", ".gq", ".top", ".xyz"}


def score_url(url: str) -> dict[str, Any]:
    """Score a URL using safe local heuristics without fetching its content."""

    try:
        parsed = urlparse(url.strip())
        hostname = (parsed.hostname or "").lower().rstrip(".")
    except ValueError:
        return {
            "tool": "score_url",
            "risk": "high",
            "reason": "The value is not a valid HTTP(S) URL.",
            "details": {"score": 100, "flags": ["invalid_url"], "hostname": ""},
        }

    flags: list[str] = []

    if parsed.scheme not in {"http", "https"} or not hostname:
        return {
            "tool": "score_url",
            "risk": "high",
            "reason": "The value is not a valid HTTP(S) URL.",
            "details": {"score": 100, "flags": ["invalid_url"], "hostname": hostname},
        }

    if parsed.scheme == "http":
        flags.append("unencrypted_http")
    if parsed.username or parsed.password:
        flags.append("embedded_credentials")
    if "xn--" in hostname:
        flags.append("punycode_hostname")
    try:
        address = ipaddress.ip_address(hostname)
        flags.append("ip_address_hostname")
        if address.is_private or address.is_loopback or address.is_link_local:
            flags.append("private_or_local_address")
    except ValueError:
        pass
    if hostname in _SHORTENER_HOSTS:
        flags.append("url_shortener")
    if any(hostname.endswith(tld) for tld in _SUSPICIOUS_TLDS):
        flags.append("suspicious_tld")
    if len(hostname.split(".")) > 4:
        flags.append("many_subdomains")
    if "@" in parsed.netloc:
        flags.append("misleading_at_sign")
    if len(url) > 180:
        flags.append("unusually_long_url")

    score = min(100, len(flags) * 20)
    if "embedded_credentials" in flags or "misleading_at_sign" in flags:
        score = max(score, 80)
    risk = "high" if score >= 60 else "med" if score >= 20 else "low"
    reason = "No notable phishing heuristics were detected." if not flags else f"Detected {len(flags)} phishing heuristic(s)."
    return {
        "tool": "score_url",
        "risk": risk,
        "reason": reason,
        "details": {
            "score": score,
            "flags": flags,
            "hostname": hostname,
            "scheme": parsed.scheme,
            "head_check": {"performed": False, "reason": "Heuristic-only check; no untrusted content was fetched."},
        },
    }
