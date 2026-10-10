"""Parse authentication logs for defensive indicators."""

from __future__ import annotations

import ipaddress
import re
from collections import Counter
from typing import Any

_IP_PATTERN = re.compile(r"(?<![0-9A-Fa-f:.])(?:[0-9A-Fa-f]{1,4}:){2,}[0-9A-Fa-f:.]+|(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)")
_FAILED_PATTERN = re.compile(r"(?:failed password|authentication failure|invalid user)", re.IGNORECASE)
_SUCCESS_PATTERN = re.compile(r"(?:accepted (?:password|publickey)|session opened)", re.IGNORECASE)
_BRUTE_FORCE_THRESHOLD = 5


def _ip_from_line(line: str) -> str | None:
    for match in _IP_PATTERN.finditer(line):
        candidate = match.group(0)
        try:
            ipaddress.ip_address(candidate)
        except ValueError:
            continue
        return candidate
    return None


def analyze_auth_log(log_text: str) -> dict[str, Any]:
    """Analyze auth log text for repeated failures and unusual public IPs."""

    failed_by_ip: Counter[str] = Counter()
    successful_by_ip: Counter[str] = Counter()
    source_ips: set[str] = set()
    parsed_lines = 0

    for line in log_text.splitlines():
        ip = _ip_from_line(line)
        is_failed = bool(_FAILED_PATTERN.search(line))
        is_success = bool(_SUCCESS_PATTERN.search(line))
        if not (is_failed or is_success):
            continue
        parsed_lines += 1
        if ip:
            source_ips.add(ip)
            if is_failed:
                failed_by_ip[ip] += 1
            if is_success:
                successful_by_ip[ip] += 1

    brute_force_sources = sorted(
        ip for ip, count in failed_by_ip.items() if count >= _BRUTE_FORCE_THRESHOLD
    )
    odd_ips: list[str] = []
    for source_ip in sorted(source_ips):
        address = ipaddress.ip_address(source_ip)
        if address.is_global:
            odd_ips.append(source_ip)

    if brute_force_sources:
        risk = "high"
        reason = "Repeated authentication failures indicate possible brute-force activity."
    elif odd_ips:
        risk = "med"
        reason = "Authentication activity includes public source IP address(es)."
    else:
        risk = "low"
        reason = "No brute-force threshold or public-source indicator was detected."

    return {
        "tool": "analyze_auth_log",
        "risk": risk,
        "reason": reason,
        "details": {
            "parsed_auth_lines": parsed_lines,
            "failed_attempts": sum(failed_by_ip.values()),
            "successful_logins": sum(successful_by_ip.values()),
            "failures_by_ip": dict(sorted(failed_by_ip.items())),
            "successes_by_ip": dict(sorted(successful_by_ip.items())),
            "brute_force_sources": brute_force_sources,
            "odd_ips": odd_ips,
            "source_ips": sorted(source_ips),
        },
    }
