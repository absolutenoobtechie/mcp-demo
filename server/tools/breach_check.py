"""Privacy-preserving password breach check using HIBP k-anonymity."""

from __future__ import annotations

import hashlib
from typing import Any

import httpx

_HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/{}"


def check_password_breach(password: str) -> dict[str, Any]:
    """Check a password against HIBP by sending only its SHA-1 prefix."""

    if not password:
        return {
            "tool": "check_password_breach",
            "risk": "low",
            "reason": "An empty password was not sent to the breach service.",
            "details": {"breached": False, "occurrences": 0},
        }

    digest = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = digest[:5], digest[5:]
    try:
        response = httpx.get(
            _HIBP_RANGE_URL.format(prefix),
            headers={"Add-Padding": "true"},
            timeout=10.0,
        )
        if response.status_code >= 400:
            return {
                "tool": "check_password_breach",
                "risk": "med",
                "reason": "The breach service returned an error.",
                "details": {"breached": None, "occurrences": None},
            }
    except httpx.HTTPError:
        return {
            "tool": "check_password_breach",
            "risk": "med",
            "reason": "The breach service could not be reached.",
            "details": {"breached": None, "occurrences": None},
        }

    occurrences = 0
    for line in response.text.splitlines():
        returned_suffix, separator, count = line.partition(":")
        if separator and returned_suffix.strip().upper() == suffix:
            try:
                occurrences = int(count.strip())
            except ValueError:
                occurrences = 0
            break

    return {
        "tool": "check_password_breach",
        "risk": "high" if occurrences else "low",
        "reason": (
            "The password hash was found in known breach data."
            if occurrences
            else "The password hash was not found in the returned breach data."
        ),
        "details": {
            "breached": bool(occurrences),
            "occurrences": occurrences,
            "sha1_prefix": prefix,
        },
    }
