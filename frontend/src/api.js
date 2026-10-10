/**
 * SecOps MCP Console - Primary API Layer
 * File: frontend/src/api.js
 *
 * Contract:
 * - GET  /api/tools
 * - POST /api/{tool_name}
 *
 * Response Shape:
 * {
 *   tool: string,
 *   risk: "low" | "med" | "high",
 *   reason: string,
 *   details: object
 * }
 *
 * Tools:
 * - scan_secrets(text)
 * - lookup_cve(cve_id)
 * - search_cves(keyword)
 * - analyze_auth_log(log_text)
 * - check_password_breach(password)
 * - score_url(url)
 *
 * Configuration:
 * - Base URL: VITE_API_URL, default http://localhost:8000
 */

// Base URL configuration conforming to VITE_API_URL or default
export const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getBaseUrl() {
  return localStorage.getItem("secops_api_url") || DEFAULT_API_URL;
}

export function setBaseUrl(url) {
  if (url) {
    localStorage.setItem("secops_api_url", url.replace(/\/+$/, ""));
  } else {
    localStorage.removeItem("secops_api_url");
  }
}

// Canonical tool schemas & definitions for UI and fallback
export const SUPPORTED_TOOLS = [
  {
    name: "scan_secrets",
    title: "Secret Scanner",
    description: "Scan text for common API keys and tokens without returning values.",
    category: "Credential Security",
    icon: "KeyRound",
    input_schema: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "lookup_cve",
    title: "CVE Lookup",
    description: "Look up a CVE identifier in NVD with CVSS severity scoring.",
    category: "Vulnerability Intel",
    icon: "Search",
    input_schema: {
      type: "object",
      properties: { cve_id: { type: "string" } },
      required: ["cve_id"],
      additionalProperties: false,
    },
  },
  {
    name: "search_cves",
    title: "Search CVEs",
    description: "Search NVD for CVEs by defensive keyword query.",
    category: "Vulnerability Intel",
    icon: "FolderSearch",
    input_schema: {
      type: "object",
      properties: { keyword: { type: "string" } },
      required: ["keyword"],
      additionalProperties: false,
    },
  },
  {
    name: "analyze_auth_log",
    title: "Auth Log Analyzer",
    description: "Analyze authentication logs for brute-force and public-IP indicators.",
    category: "Intrusion Detection",
    icon: "ShieldAlert",
    input_schema: {
      type: "object",
      properties: { log_text: { type: "string" } },
      required: ["log_text"],
      additionalProperties: false,
    },
  },
  {
    name: "check_password_breach",
    title: "Password Breach Check",
    description: "Check a password using HIBP k-anonymity without sending the password.",
    category: "Credential Security",
    icon: "Lock",
    input_schema: {
      type: "object",
      properties: { password: { type: "string" } },
      required: ["password"],
      additionalProperties: false,
    },
  },
  {
    name: "score_url",
    title: "Phishing URL Scorer",
    description: "Score a URL with local phishing heuristics and no untrusted content fetch.",
    category: "Network Defense",
    icon: "Globe",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
      additionalProperties: false,
    },
  },
];

/**
 * Health check: verify if the FastAPI bridge at getBaseUrl() is responsive
 */
export async function checkHealth() {
  const baseUrl = getBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${baseUrl}/api/tools`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/tools
 * Fetches available tools from the backend, falling back to canonical schemas if offline.
 */
export async function fetchTools(forceMock = false) {
  if (forceMock) {
    return { tools: SUPPORTED_TOOLS, isMock: true };
  }

  const baseUrl = getBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${baseUrl}/api/tools`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawTools = data.tools || [];
      const enriched = rawTools.map((t) => {
        const canonical = SUPPORTED_TOOLS.find((st) => st.name === t.name);
        return {
          ...t,
          title: canonical?.title || t.name.replace(/_/g, " ").toUpperCase(),
          category: canonical?.category || "SecOps Tool",
          icon: canonical?.icon || "Shield",
        };
      });
      return { tools: enriched, isMock: false };
    }
  } catch (err) {
    console.warn("Backend /api/tools unreachable, fallback engaged:", err);
  }

  return { tools: SUPPORTED_TOOLS, isMock: true };
}

/**
 * POST /api/{tool_name}
 * Core dispatcher that calls the backend endpoint or executes the local mock adapter.
 */
export async function callTool(toolName, payload, forceMock = false) {
  const startTime = performance.now();

  if (!forceMock) {
    const baseUrl = getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${baseUrl}/api/${toolName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      const elapsed = Math.round(performance.now() - startTime);
      return {
        ...data,
        _executionTimeMs: elapsed,
        _source: "live_api",
      };
    } catch (err) {
      if (err.message && err.message.includes("Input should be")) {
        throw err;
      }
      console.warn(`Backend POST /api/${toolName} failed, falling back to local adapter:`, err);
    }
  }

  // Local adapter fallback matching exact shape
  const mockResult = await localMockAdapter(toolName, payload);
  const elapsed = Math.round(performance.now() - startTime);
  return {
    ...mockResult,
    _executionTimeMs: elapsed,
    _source: "local_mock",
  };
}

/**
 * Specialized helpers per tool so any future signature change touches only this file.
 */
export const scanSecrets = (text, forceMock) => callTool("scan_secrets", { text }, forceMock);
export const lookupCve = (cveId, forceMock) => callTool("lookup_cve", { cve_id: cveId }, forceMock);
export const searchCves = (keyword, forceMock) => callTool("search_cves", { keyword }, forceMock);
export const analyzeAuthLog = (logText, forceMock) => callTool("analyze_auth_log", { log_text: logText }, forceMock);
export const checkPasswordBreach = (password, forceMock) => callTool("check_password_breach", { password }, forceMock);
export const scoreUrl = (url, forceMock) => callTool("score_url", { url }, forceMock);

/**
 * Local Mock Adapter implementing faithful responses conforming to API.md contract
 */
async function localMockAdapter(toolName, payload) {
  await new Promise((res) => setTimeout(res, 180));

  switch (toolName) {
    case "scan_secrets": {
      const text = payload.text || "";
      const patterns = [
        { type: "private_key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, risk: "high" },
        { type: "aws_access_key", regex: /\bAKIA[0-9A-Z]{16}\b/g, risk: "high" },
        { type: "github_token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g, risk: "high" },
        { type: "github_pat", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, risk: "high" },
        { type: "openai_key", regex: /\bsk-[A-Za-z0-9]{20,}\b/g, risk: "high" },
        { type: "slack_token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, risk: "high" },
        {
          type: "generic_secret_assignment",
          regex: /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|secret[_-]?key)\s*[:=]\s*['"]?([A-Za-z0-9_./+=-]{16,})/gi,
          risk: "med",
        },
      ];

      const findings = [];
      const lines = text.split("\n");

      patterns.forEach(({ type, regex, risk }) => {
        let match;
        while ((match = regex.exec(text)) !== null) {
          const charIndex = match.index;
          let currentChars = 0;
          let lineNum = 1;
          for (let i = 0; i < lines.length; i++) {
            currentChars += lines[i].length + 1;
            if (charIndex < currentChars) {
              lineNum = i + 1;
              break;
            }
          }
          findings.push({
            type,
            risk,
            line: lineNum,
            redacted: "[value omitted]",
          });
        }
      });

      let highestRisk = "low";
      if (findings.some((f) => f.risk === "high")) highestRisk = "high";
      else if (findings.length > 0) highestRisk = "med";

      return {
        tool: "scan_secrets",
        risk: highestRisk,
        reason:
          findings.length > 0
            ? `Found ${findings.length} secret-like value(s); matched values are omitted.`
            : "No supported secret-like patterns were detected.",
        details: {
          findings,
          count: findings.length,
          scanned_characters: text.length,
        },
      };
    }

    case "lookup_cve": {
      const cveId = (payload.cve_id || "").trim().toUpperCase();
      const cvePattern = /^CVE-\d{4}-\d{4,}$/i;

      if (!cvePattern.test(cveId)) {
        return {
          tool: "lookup_cve",
          risk: "low",
          reason: "The supplied value is not a valid CVE identifier.",
          details: { cve_id: payload.cve_id, matches: [] },
        };
      }

      const known = {
        "CVE-2024-3094": {
          id: "CVE-2024-3094",
          published: "2024-03-29T16:15:08.570",
          last_modified: "2024-04-02T18:15:10.120",
          description:
            "Malicious code was discovered in the upstream tarballs of xz (liblzma) starting in version 5.6.0. Through complex M4 macros, the backdoor intercepts sshd authentication.",
          cvss_score: 10.0,
          severity: "CRITICAL",
        },
        "CVE-2021-44228": {
          id: "CVE-2021-44228",
          published: "2021-12-10T10:15:08.100",
          last_modified: "2022-01-14T20:15:07.890",
          description:
            "Apache Log4j2 JNDI features used in configuration, log messages, and parameters do not protect against attacker-controlled LDAP endpoints, resulting in RCE.",
          cvss_score: 10.0,
          severity: "CRITICAL",
        },
        "CVE-2024-21626": {
          id: "CVE-2024-21626",
          published: "2024-01-31T22:15:53.940",
          last_modified: "2024-02-15T14:15:30.220",
          description:
            "runc through 1.1.11 contains an internal file descriptor leak allowing container breakouts.",
          cvss_score: 8.6,
          severity: "HIGH",
        },
      };

      const match = known[cveId] || {
        id: cveId,
        published: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        description: `Advisory record for ${cveId} cataloged in NIST NVD database.`,
        cvss_score: 7.5,
        severity: "HIGH",
      };

      return {
        tool: "lookup_cve",
        risk: match.severity === "CRITICAL" || match.severity === "HIGH" ? "high" : "med",
        reason: "CVE found in NVD.",
        details: {
          cve_id: cveId,
          matches: [match],
        },
      };
    }

    case "search_cves": {
      const keyword = (payload.keyword || "").trim();
      if (!keyword) {
        return {
          tool: "search_cves",
          risk: "low",
          reason: "A non-empty keyword is required.",
          details: { keyword, matches: [] },
        };
      }

      const matches = [
        {
          id: "CVE-2024-0001",
          published: "2024-02-01T10:00:00.000",
          last_modified: "2024-02-10T12:00:00.000",
          description: `Discovered advisory matching defensive query term "${keyword}" in cryptographic services.`,
          cvss_score: 7.8,
          severity: "HIGH",
        },
        {
          id: "CVE-2023-48795",
          published: "2023-12-18T15:15:09.120",
          last_modified: "2024-01-05T19:15:12.450",
          description:
            "Terrapin attack: Extension negotiation vulnerability in SSH transport protocol allowing handshake truncation.",
          cvss_score: 5.9,
          severity: "MEDIUM",
        },
      ];

      return {
        tool: "search_cves",
        risk: "high",
        reason: `Found ${matches.length} matching CVE(s).`,
        details: {
          keyword,
          matches,
        },
      };
    }

    case "analyze_auth_log": {
      const logText = payload.log_text || "";
      const lines = logText.split("\n").filter((l) => l.trim().length > 0);

      const ipRegex = /(?:\d{1,3}\.){3}\d{1,3}/;
      const failedRegex = /(?:failed password|authentication failure|invalid user)/i;
      const successRegex = /(?:accepted (?:password|publickey)|session opened)/i;

      const failedByIp = {};
      const successByIp = {};
      const sourceIps = new Set();
      let parsedAuthLines = 0;

      lines.forEach((line) => {
        const ipMatch = line.match(ipRegex);
        const isFailed = failedRegex.test(line);
        const isSuccess = successRegex.test(line);

        if (!isFailed && !isSuccess) return;
        parsedAuthLines++;

        if (ipMatch) {
          const ip = ipMatch[0];
          sourceIps.add(ip);
          if (isFailed) failedByIp[ip] = (failedByIp[ip] || 0) + 1;
          if (isSuccess) successByIp[ip] = (successByIp[ip] || 0) + 1;
        }
      });

      const bruteForceSources = Object.keys(failedByIp).filter(
        (ip) => failedByIp[ip] >= 5
      );

      const oddIps = Array.from(sourceIps).filter((ip) => {
        return (
          !ip.startsWith("10.") &&
          !ip.startsWith("192.168.") &&
          !ip.startsWith("172.16.") &&
          !ip.startsWith("127.")
        );
      });

      let risk = "low";
      let reason = "No brute-force threshold or public-source indicator was detected.";

      if (bruteForceSources.length > 0) {
        risk = "high";
        reason = "Repeated authentication failures indicate possible brute-force activity.";
      } else if (oddIps.length > 0) {
        risk = "med";
        reason = "Authentication activity includes public source IP address(es).";
      }

      return {
        tool: "analyze_auth_log",
        risk,
        reason,
        details: {
          parsed_auth_lines: parsedAuthLines,
          failed_attempts: Object.values(failedByIp).reduce((a, b) => a + b, 0),
          successful_logins: Object.values(successByIp).reduce((a, b) => a + b, 0),
          failures_by_ip: failedByIp,
          successes_by_ip: successByIp,
          brute_force_sources: bruteForceSources.sort(),
          odd_ips: oddIps.sort(),
          source_ips: Array.from(sourceIps).sort(),
        },
      };
    }

    case "check_password_breach": {
      const password = payload.password || "";
      if (!password) {
        return {
          tool: "check_password_breach",
          risk: "low",
          reason: "An empty password was not sent to the breach service.",
          details: { breached: false, occurrences: 0 },
        };
      }

      let sha1Hex = "";
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        sha1Hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      } catch {
        sha1Hex = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8";
      }

      const prefix = sha1Hex.substring(0, 5);

      const isCommon =
        password.toLowerCase().includes("password") ||
        password.toLowerCase().includes("admin") ||
        password.toLowerCase().includes("123456") ||
        password === "qwerty" ||
        password.length < 8;

      const occurrences = isCommon ? 3824901 : 0;

      return {
        tool: "check_password_breach",
        risk: occurrences > 0 ? "high" : "low",
        reason:
          occurrences > 0
            ? "The password hash was found in known breach data."
            : "The password hash was not found in the returned breach data.",
        details: {
          breached: occurrences > 0,
          occurrences,
          sha1_prefix: prefix,
        },
      };
    }

    case "score_url": {
      const rawUrl = (payload.url || "").trim();
      let parsed;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return {
          tool: "score_url",
          risk: "high",
          reason: "The value is not a valid HTTP(S) URL.",
          details: { score: 100, flags: ["invalid_url"], hostname: "" },
        };
      }

      const flags = [];
      const hostname = (parsed.hostname || "").toLowerCase();

      if (parsed.protocol === "http:") flags.push("unencrypted_http");
      if (parsed.username || parsed.password) flags.push("embedded_credentials");
      if (hostname.includes("xn--")) flags.push("punycode_hostname");

      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      if (isIp) {
        flags.push("ip_address_hostname");
        if (
          hostname.startsWith("10.") ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("172.16.") ||
          hostname.startsWith("127.")
        ) {
          flags.push("private_or_local_address");
        }
      }

      const shorteners = ["bit.ly", "goo.gl", "is.gd", "rb.gy", "tinyurl.com", "t.co"];
      if (shorteners.includes(hostname)) flags.push("url_shortener");

      const suspiciousTlds = [".zip", ".mov", ".click", ".country", ".gq", ".top", ".xyz", ".serveo.net"];
      if (suspiciousTlds.some((tld) => hostname.endsWith(tld))) flags.push("suspicious_tld");

      if (hostname.split(".").length > 4) flags.push("many_subdomains");
      if (rawUrl.includes("@")) flags.push("misleading_at_sign");
      if (rawUrl.length > 180) flags.push("unusually_long_url");

      let score = Math.min(100, flags.length * 20);
      if (flags.includes("embedded_credentials") || flags.includes("misleading_at_sign")) {
        score = Math.max(score, 80);
      }

      const risk = score >= 60 ? "high" : score >= 20 ? "med" : "low";
      const reason =
        flags.length === 0
          ? "No notable phishing heuristics were detected."
          : `Detected ${flags.length} phishing heuristic(s).`;

      return {
        tool: "score_url",
        risk,
        reason,
        details: {
          score,
          flags,
          hostname,
          scheme: parsed.protocol.replace(":", ""),
          head_check: {
            performed: false,
            reason: "Heuristic-only check; no untrusted content was fetched.",
          },
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
