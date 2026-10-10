# Contributing to SecOps MCP

Thank you for your interest in contributing to **SecOps MCP**! This is a personal side project focused on safe, defensive security tooling for AI agents.

## Core Rules

1. **Defensive Tools Only**: We do not accept offensive, exploitation, or attack tooling.
2. **Privacy by Design**: Tools must never store, log, or leak sensitive input data (credentials, secrets, or full passwords).
3. **Pure Functions**: Core tool logic lives in `server/tools/` as pure, testable functions shared between FastMCP and FastAPI.
4. **Structured Response Contract**: Every tool must return:
   ```json
   {
     "tool": "<tool_name>",
     "risk": "low" | "med" | "high",
     "reason": "<human-readable string>",
     "details": { ... }
   }
   ```
5. **No SSRF / Unbounded Calls**: Do not initiate outbound HTTP requests to user-provided arbitrary endpoints. Use a 10-second timeout on external APIs.

## Local Development Workflow

1. Fork and clone the repository.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
   pip install -e ".[dev]"
   ```
3. Run test suite:
   ```bash
   pytest
   ```
4. Verify frontend builds cleanly:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

5. Open a Pull Request with a clear description of your changes and test coverage.
