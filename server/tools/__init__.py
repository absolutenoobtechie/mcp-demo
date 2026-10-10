"""Pure, defensive security analysis tools."""

from .breach_check import check_password_breach
from .cve_lookup import lookup_cve, search_cves
from .incident_report import generate_incident_report
from .log_analyzer import analyze_auth_log
from .secrets_scan import scan_secrets
from .url_check import score_url

__all__ = [
    "analyze_auth_log",
    "check_password_breach",
    "generate_incident_report",
    "lookup_cve",
    "scan_secrets",
    "score_url",
    "search_cves",
]
