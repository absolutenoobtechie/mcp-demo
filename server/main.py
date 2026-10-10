"""FastMCP stdio entrypoint for the defensive SecOps tools."""

from mcp.server.fastmcp import FastMCP

from server.tools import (
    analyze_auth_log,
    check_password_breach,
    generate_incident_report,
    lookup_cve,
    scan_secrets,
    score_url,
    search_cves,
)

mcp = FastMCP("secops-mcp")

for tool_function in (
    scan_secrets,
    lookup_cve,
    search_cves,
    analyze_auth_log,
    check_password_breach,
    generate_incident_report,
    score_url,
):
    mcp.tool(name=tool_function.__name__)(tool_function)


if __name__ == "__main__":
    mcp.run(transport="stdio")
