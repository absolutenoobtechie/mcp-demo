from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import httpx

from server.tools.breach_check import check_password_breach
from server.tools.cve_lookup import lookup_cve, search_cves
from server.tools.log_analyzer import analyze_auth_log
from server.tools.secrets_scan import scan_secrets
from server.tools.url_check import score_url


class FakeResponse:
    def __init__(self, *, payload: dict[str, Any] | None = None, text: str = "", status_code: int = 200):
        self._payload = payload or {}
        self.text = text
        self.status_code = status_code

    def json(self) -> dict[str, Any]:
        return self._payload


def test_scan_secrets_redacts_matches() -> None:
    secret = "sk-1234567890abcdefghijkl"
    result = scan_secrets(f"OPENAI_API_KEY={secret}")

    assert result["tool"] == "scan_secrets"
    assert result["risk"] == "high"
    assert result["details"]["count"] == 1
    assert secret not in json.dumps(result)


def test_lookup_cve_uses_nvd_response(monkeypatch) -> None:
    def fake_get(url, **kwargs):
        assert url.endswith("/cves/2.0")
        assert kwargs["params"] == {"cveId": "CVE-2024-0001"}
        assert kwargs["timeout"] == 10.0
        return FakeResponse(
            payload={
                "vulnerabilities": [
                    {
                        "cve": {
                            "id": "CVE-2024-0001",
                            "descriptions": [{"lang": "en", "value": "Demo issue"}],
                            "metrics": {
                                "cvssMetricV31": [
                                    {"cvssData": {"baseScore": 8.8, "baseSeverity": "HIGH"}}
                                ]
                            },
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr("server.tools.cve_lookup.httpx.get", fake_get)
    result = lookup_cve("cve-2024-0001")

    assert result["risk"] == "high"
    assert result["details"]["matches"][0]["id"] == "CVE-2024-0001"


def test_search_cves_handles_upstream_failure(monkeypatch) -> None:
    def fake_get(*args, **kwargs):
        raise httpx.TimeoutException("simulated timeout")

    monkeypatch.setattr("server.tools.cve_lookup.httpx.get", fake_get)
    result = search_cves("openssl")

    assert result["risk"] == "med"
    assert result["details"]["keyword"] == "openssl"
    assert "could not be reached" in result["reason"]


def test_analyze_auth_log_flags_brute_force_and_public_ip() -> None:
    sample = (Path(__file__).resolve().parents[1] / "samples" / "auth.log").read_text(encoding="utf-8")
    result = analyze_auth_log(sample)

    assert result["risk"] == "high"
    assert result["details"]["brute_force_sources"] == ["45.67.89.10"]
    assert result["details"]["odd_ips"] == ["45.67.89.10"]
    assert result["details"]["successful_logins"] == 1


def test_check_password_breach_sends_only_hash_prefix(monkeypatch) -> None:
    password = "demo-password"
    digest = hashlib.sha1(password.encode()).hexdigest().upper()
    suffix = digest[5:]
    calls: list[tuple[str, dict[str, Any]]] = []

    def fake_get(url, **kwargs):
        calls.append((url, kwargs))
        return FakeResponse(text=f"{suffix}:3\nOTHERHASH:1\n")

    monkeypatch.setattr("server.tools.breach_check.httpx.get", fake_get)
    result = check_password_breach(password)

    assert result["risk"] == "high"
    assert result["details"]["occurrences"] == 3
    assert password not in json.dumps(calls)
    assert digest[:5] in calls[0][0]
    assert calls[0][1]["timeout"] == 10.0


def test_score_url_is_local_and_flags_suspicious_url() -> None:
    result = score_url("http://user:pass@xn--paypa1-7ve.example.xyz/login")

    assert result["risk"] == "high"
    assert "embedded_credentials" in result["details"]["flags"]
    assert "punycode_hostname" in result["details"]["flags"]
    assert result["details"]["head_check"]["performed"] is False
