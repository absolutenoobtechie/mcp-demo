"""FastAPI bridge exposing the same defensive functions as the MCP server."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from fastapi import Body, FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, ValidationError

from server.tools import (
    analyze_auth_log,
    check_password_breach,
    generate_incident_report,
    lookup_cve,
    scan_secrets,
    score_url,
    search_cves,
)


class StrictInput(BaseModel):
    """Reject accidental or misspelled input fields at the API boundary."""

    model_config = ConfigDict(extra="forbid")


class ScanSecretsInput(StrictInput):
    text: str


class LookupCveInput(StrictInput):
    cve_id: str


class SearchCvesInput(StrictInput):
    keyword: str


class AnalyzeAuthLogInput(StrictInput):
    log_text: str


class CheckPasswordBreachInput(StrictInput):
    password: str


class ScoreUrlInput(StrictInput):
    url: str


class GenerateIncidentReportInput(StrictInput):
    findings: list[dict[str, Any]]


@dataclass(frozen=True)
class ToolDefinition:
    description: str
    input_model: type[StrictInput]
    function: Callable[..., dict[str, Any]]


TOOL_DEFINITIONS: dict[str, ToolDefinition] = {
    "scan_secrets": ToolDefinition(
        "Scan text for common API keys and tokens without returning values.", ScanSecretsInput, scan_secrets
    ),
    "lookup_cve": ToolDefinition("Look up a CVE identifier in NVD.", LookupCveInput, lookup_cve),
    "search_cves": ToolDefinition("Search NVD for CVEs by keyword.", SearchCvesInput, search_cves),
    "analyze_auth_log": ToolDefinition(
        "Analyze authentication logs for brute-force and public-IP indicators.",
        AnalyzeAuthLogInput,
        analyze_auth_log,
    ),
    "check_password_breach": ToolDefinition(
        "Check a password using HIBP k-anonymity without sending the password.",
        CheckPasswordBreachInput,
        check_password_breach,
    ),
    "score_url": ToolDefinition(
        "Score a URL with local phishing heuristics and no content fetch.", ScoreUrlInput, score_url
    ),
    "generate_incident_report": ToolDefinition(
        "Prioritize prior defensive findings and recommend response actions.",
        GenerateIncidentReportInput,
        generate_incident_report,
    ),
}

app = FastAPI(title="SecOps MCP API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/tools")
async def list_tools() -> dict[str, list[dict[str, Any]]]:
    """Return the available tools and their JSON input schemas."""

    return {
        "tools": [
            {
                "name": name,
                "description": definition.description,
                "input_schema": definition.input_model.model_json_schema(),
            }
            for name, definition in TOOL_DEFINITIONS.items()
        ]
    }


@app.post("/api/{tool_name}")
async def call_tool(tool_name: str, payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Validate input and invoke one of the defensive analysis tools."""

    definition = TOOL_DEFINITIONS.get(tool_name)
    if definition is None:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_name}")
    try:
        validated = definition.input_model.model_validate(payload)
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=error.errors()) from error
    return await run_in_threadpool(definition.function, **validated.model_dump())
