from fastapi.testclient import TestClient

from server.api import app

client = TestClient(app)


def test_list_tools_exposes_all_six_tools() -> None:
    response = client.get("/api/tools")

    assert response.status_code == 200
    assert {item["name"] for item in response.json()["tools"]} == {
        "scan_secrets",
        "lookup_cve",
        "search_cves",
        "analyze_auth_log",
        "check_password_breach",
        "score_url",
    }


def test_api_validates_and_invokes_tool() -> None:
    response = client.post("/api/score_url", json={"url": "https://example.com"})

    assert response.status_code == 200
    assert response.json()["tool"] == "score_url"
    assert response.json()["risk"] == "low"


def test_api_rejects_unknown_tool_and_extra_fields() -> None:
    unknown = client.post("/api/not_a_tool", json={})
    invalid = client.post("/api/score_url", json={"url": "https://example.com", "extra": True})

    assert unknown.status_code == 404
    assert invalid.status_code == 422


def test_api_sets_localhost_cors_header() -> None:
    response = client.get("/api/tools", headers={"Origin": "http://localhost:5173"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
