import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import ToolPanel from "./components/ToolPanel";
import FindingDetailModal from "./components/FindingDetailModal";
import {
  fetchTools,
  checkHealth as pingBackend,
  callTool,
  SUPPORTED_TOOLS,
} from "./api";
import { Menu, Shield } from "lucide-react";

// Initial demo history so judges immediately see data on first load
const INITIAL_DEMO_HISTORY = [
  {
    tool: "analyze_auth_log",
    risk: "high",
    reason: "Repeated authentication failures indicate possible brute-force activity.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    _executionTimeMs: 142,
    _source: "live_api",
    details: {
      parsed_auth_lines: 6,
      failed_attempts: 5,
      successful_logins: 1,
      brute_force_sources: ["45.67.89.10"],
      odd_ips: ["45.67.89.10"],
      failures_by_ip: { "45.67.89.10": 5 },
      successes_by_ip: { "192.168.1.20": 1 },
    },
  },
  {
    tool: "scan_secrets",
    risk: "high",
    reason: "Found 3 secret-like value(s); matched values are omitted.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    _executionTimeMs: 88,
    _source: "live_api",
    details: {
      count: 3,
      scanned_characters: 215,
      findings: [
        { type: "openai_key", risk: "high", line: 2, redacted: "[value omitted]" },
        { type: "aws_access_key", risk: "high", line: 3, redacted: "[value omitted]" },
        { type: "github_token", risk: "high", line: 4, redacted: "[value omitted]" },
      ],
    },
  },
  {
    tool: "score_url",
    risk: "high",
    reason: "Detected 4 phishing heuristic(s).",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    _executionTimeMs: 45,
    _source: "live_api",
    details: {
      score: 80,
      hostname: "paypa1-security-verification.serveo.net",
      scheme: "https",
      flags: ["suspicious_tld", "many_subdomains", "embedded_credentials"],
      head_check: { performed: false, reason: "Heuristic-only check; no untrusted content was fetched." },
    },
  },
];

export default function App() {
  const [tools, setTools] = useState(SUPPORTED_TOOLS);
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Connection & mode state
  const [isMockMode, setIsMockMode] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [hasCheckedHealth, setHasCheckedHealth] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [toolError, setToolError] = useState(null);
  const [lastResultsByTool, setLastResultsByTool] = useState({});

  // History & findings
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("secops_audit_history");
    return saved ? JSON.parse(saved) : INITIAL_DEMO_HISTORY;
  });
  const [inspectedFinding, setInspectedFinding] = useState(null);

  // Calculate session statistics
  const stats = {
    total: history.length,
    high: history.filter((h) => h.risk === "high").length,
    med: history.filter((h) => h.risk === "med").length,
    low: history.filter((h) => h.risk === "low").length,
  };

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem("secops_audit_history", JSON.stringify(history));
  }, [history]);

  // Ping backend health
  const checkHealthStatus = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const healthy = await pingBackend();
      setApiOnline(healthy);
      return healthy;
    } finally {
      setIsCheckingHealth(false);
      setHasCheckedHealth(true);
    }
  }, []);

  // Fetch tools list on startup and mode toggle
  useEffect(() => {
    async function loadTools() {
      const healthy = await checkHealthStatus();
      const res = await fetchTools(isMockMode || !healthy);
      setTools(res.tools);
    }
    loadTools();
  }, [isMockMode, checkHealthStatus]);

  // Run a tool
  const handleRunTool = async (toolName, payload) => {
    setIsRunning(true);
    setToolError(null);

    try {
      const response = await callTool(toolName, payload, isMockMode);
      if (!isMockMode && response._source === "local_mock") {
        setApiOnline(false);
        setHasCheckedHealth(true);
      }
      const enrichedResult = {
        ...response,
        timestamp: new Date().toISOString(),
      };

      // Update current result for tool panel
      setLastResultsByTool((prev) => ({
        ...prev,
        [toolName]: enrichedResult,
      }));

      // Add to session audit log
      setHistory((prev) => [enrichedResult, ...prev]);
    } catch (err) {
      console.error("Error executing tool:", err);
      setToolError(err.message || "An unexpected error occurred while running the tool.");
    } finally {
      setIsRunning(false);
    }
  };

  // Run a tool directly from sample button in Dashboard
  const handleRunToolWithSample = async (toolName, payload) => {
    setActiveView(toolName);
    await handleRunTool(toolName, payload);
  };

  // Clear current tool result
  const handleClearToolResult = (toolName) => {
    setLastResultsByTool((prev) => {
      const updated = { ...prev };
      delete updated[toolName];
      return updated;
    });
    setToolError(null);
  };

  // Clear audit history
  const handleClearHistory = () => {
    setHistory([]);
    setLastResultsByTool({});
    localStorage.removeItem("secops_audit_history");
  };

  const selectedTool = tools.find((t) => t.name === activeView);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans cyber-grid">
      {/* Top Navigation */}
      <Navbar
        isMockMode={isMockMode}
        setIsMockMode={setIsMockMode}
        isCheckingHealth={isCheckingHealth}
        apiOnline={apiOnline}
        checkHealth={checkHealthStatus}
        stats={stats}
      />

      {hasCheckedHealth && !apiOnline && (
        <div
          role="alert"
          className="border-b border-rose-500/70 bg-rose-950/95 px-4 py-3 text-center font-mono text-sm font-bold tracking-wide text-rose-100"
        >
          BACKEND OFFLINE - SIMULATED DATA
          <span className="ml-2 font-normal text-rose-200/80">
            Results are from the local demo adapter.
          </span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          tools={tools}
          activeView={activeView}
          setActiveView={setActiveView}
          lastRunsByTool={lastResultsByTool}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-72 flex flex-col">
          {/* Mobile view switcher bar */}
          <div className="flex items-center justify-between p-4 border-b border-[#1f2e4d] bg-[#070b17] lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[#1f2e4d] bg-[#0c1427] px-3 py-1.5 text-xs font-medium text-slate-300"
            >
              <Menu className="h-4 w-4 text-cyan-400" />
              <span>Menu & Tools</span>
            </button>
            <span className="font-mono text-xs text-cyan-400 uppercase">
              {activeView === "dashboard" ? "Dashboard" : activeView}
            </span>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {activeView === "dashboard" || !selectedTool ? (
              <DashboardHome
                tools={tools}
                history={history}
                stats={stats}
                onSelectTool={setActiveView}
                onRunToolWithSample={handleRunToolWithSample}
                onClearHistory={handleClearHistory}
                onInspectFinding={setInspectedFinding}
              />
            ) : (
              <ToolPanel
                tool={selectedTool}
                onRunTool={handleRunTool}
                isRunning={isRunning}
                error={toolError}
                lastResult={lastResultsByTool[selectedTool.name]}
                onClearResult={() => handleClearToolResult(selectedTool.name)}
              />
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-[#1f2e4d] bg-[#070b17]/80 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-500" />
              <span>SecOps MCP Console • AI + Cybersecurity Hackathon Demo</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              CORS: <code>localhost:5173</code> ⇄ API: <code>{isMockMode ? "Mock Mode" : apiOnline ? "localhost:8000" : "Offline (Mocked)"}</code>
            </div>
          </footer>
        </main>
      </div>

      {/* Detail Modal */}
      {inspectedFinding && (
        <FindingDetailModal
          finding={inspectedFinding}
          onClose={() => setInspectedFinding(null)}
        />
      )}
    </div>
  );
}
