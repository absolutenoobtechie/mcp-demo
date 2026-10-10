import React, { useState } from "react";
import {
  Shield,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Search,
  FolderSearch,
  ShieldAlert,
  Lock,
  Globe,
  ArrowRight,
  Download,
  Trash2,
  Play,
  Terminal,
  Activity,
  Filter,
  Clock,
  Sparkles,
} from "lucide-react";
import { TOOL_SAMPLES } from "../data/samples";

const ICON_MAP = {
  scan_secrets: KeyRound,
  lookup_cve: Search,
  search_cves: FolderSearch,
  analyze_auth_log: ShieldAlert,
  check_password_breach: Lock,
  score_url: Globe,
};

export default function DashboardHome({
  tools,
  history,
  stats,
  onSelectTool,
  onRunToolWithSample,
  onClearHistory,
  onInspectFinding,
}) {
  const [filterRisk, setFilterRisk] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) => {
    if (filterRisk !== "all" && item.risk !== filterRisk) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTool = item.tool.toLowerCase().includes(q);
      const matchReason = (item.reason || "").toLowerCase().includes(q);
      if (!matchTool && !matchReason) return false;
    }
    return true;
  });

  const exportAuditLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `secops-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const highPercent = stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0;
  const medPercent = stats.total > 0 ? Math.round((stats.med / stats.total) * 100) : 0;
  const lowPercent = stats.total > 0 ? Math.round((stats.low / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero Security Intelligence Header */}
      <div className="relative rounded-2xl border border-[#1f2e4d] bg-gradient-to-r from-[#080d1a] via-[#0b1326] to-[#080d1a] p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SecOps FastMCP Bridge Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Defensive AI Security Terminal
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300">
              Real-time defensive tooling for AI agents. Run credential audits, NVD CVE queries, SSH brute-force analysis, k-anonymity password breach lookups, and SSRF-safe phishing scoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                // Quick run demo scan on auth.log
                const sample = TOOL_SAMPLES.analyze_auth_log[0];
                onRunToolWithSample("analyze_auth_log", sample.payload);
              }}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-glow-cyan transition-all"
            >
              <Sparkles className="h-4 w-4" /> Run Sample Auth Scan
            </button>
            <button
              onClick={() => {
                // Quick run secrets scan
                const sample = TOOL_SAMPLES.scan_secrets[0];
                onRunToolWithSample("scan_secrets", sample.payload);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#1f2e4d] bg-[#0c1427] hover:border-slate-500 hover:text-white px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all"
            >
              <KeyRound className="h-4 w-4 text-cyan-400" /> Run Secret Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Runs */}
        <div className="rounded-xl border border-[#1f2e4d] bg-[#080d1a] p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Session Scans</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">{stats.total}</div>
          <div className="mt-1 text-[11px] text-slate-500">Live & Mock MCP tool evaluations</div>
        </div>

        {/* High Risk */}
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-5 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>High Risk Alerts</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-rose-400">{stats.high}</div>
          <div className="mt-1 text-[11px] text-rose-400/70 font-mono">
            {highPercent}% of session evaluations
          </div>
        </div>

        {/* Med Risk */}
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Medium Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-amber-400">{stats.med}</div>
          <div className="mt-1 text-[11px] text-amber-400/70 font-mono">
            {medPercent}% of session evaluations
          </div>
        </div>

        {/* Low Risk */}
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>Clean / Low Risk</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-emerald-400">{stats.low}</div>
          <div className="mt-1 text-[11px] text-emerald-400/70 font-mono">
            {lowPercent}% of session evaluations
          </div>
        </div>
      </div>

      {/* Visual Risk Distribution Meter */}
      {stats.total > 0 && (
        <div className="rounded-xl border border-[#1f2e4d] bg-[#080d1a] p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Session Risk Profile Distribution</span>
            <span className="font-mono text-slate-400">{stats.total} Total Scans</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#050811] overflow-hidden flex">
            <div style={{ width: `${highPercent}%` }} className="bg-rose-500 transition-all" title={`High: ${highPercent}%`} />
            <div style={{ width: `${medPercent}%` }} className="bg-amber-500 transition-all" title={`Med: ${medPercent}%`} />
            <div style={{ width: `${lowPercent}%` }} className="bg-emerald-500 transition-all" title={`Low: ${lowPercent}%`} />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="text-rose-400">High: {highPercent}%</span>
            <span className="text-amber-400">Med: {medPercent}%</span>
            <span className="text-emerald-400">Low: {lowPercent}%</span>
          </div>
        </div>
      )}

      {/* Quick Launch Tool Suite Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-400" /> Defensive Tool Suite
          </h2>
          <span className="text-xs text-slate-400 font-mono">{tools.length} MCP Tools Connected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = ICON_MAP[tool.name] || Shield;
            const samples = TOOL_SAMPLES[tool.name] || [];

            return (
              <div
                key={tool.name}
                className="group relative rounded-xl border border-[#1f2e4d] bg-[#080d1a] p-5 shadow-lg transition-all hover:border-cyan-500/50 hover:shadow-glow-cyan flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1f2e4d] bg-[#0c1427] text-cyan-400 group-hover:border-cyan-500/50 group-hover:bg-cyan-950/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                      mcp:{tool.name}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {tool.title || tool.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1f2e4d]/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectTool(tool.name)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <span>Open Tool</span> <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {samples.length > 0 && (
                    <button
                      onClick={() => onRunToolWithSample(tool.name, samples[0].payload)}
                      className="rounded bg-[#0e172c] hover:bg-[#162344] border border-[#1f2e4d] px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
                      title={`Run with ${samples[0].label}`}
                    >
                      Quick Sample
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Audit History & Recent Findings */}
      <div className="rounded-xl border border-[#1f2e4d] bg-[#080d1a] p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f2e4d] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" /> Session Findings & Audit Trail
            </h2>
            <p className="text-xs text-slate-400">
              Chronological log of defensive security runs in this session
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings..."
                className="w-36 sm:w-44 rounded-lg border border-[#1f2e4d] bg-[#050811] pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Risk Filter Buttons */}
            <div className="flex rounded-lg border border-[#1f2e4d] bg-[#050811] p-1 text-xs font-mono">
              {["all", "high", "med", "low"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setFilterRisk(risk)}
                  className={`rounded px-2.5 py-1 uppercase transition-all ${
                    filterRisk === risk
                      ? "bg-cyan-900/60 text-cyan-300 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>

            {/* Export & Clear */}
            {history.length > 0 && (
              <>
                <button
                  onClick={exportAuditLog}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1f2e4d] bg-[#0c1427] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-500"
                  title="Export audit log as JSON"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/40"
                  title="Clear history"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* History Item Feed */}
        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-[#1f2e4d]/60">
            {filteredHistory.map((item, idx) => {
              const ToolIcon = ICON_MAP[item.tool] || Terminal;
              const isHigh = item.risk === "high";
              const isMed = item.risk === "med";

              return (
                <div
                  key={idx}
                  onClick={() => onInspectFinding(item)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-[#0c1427] px-3 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${
                        isHigh
                          ? "border-rose-800 bg-rose-950/50 text-rose-400"
                          : isMed
                          ? "border-amber-800 bg-amber-950/50 text-amber-400"
                          : "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                      }`}
                    >
                      <ToolIcon className="h-4 w-4" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {item.tool}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                            isHigh
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : isMed
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {item.risk} risk
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">{item.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0 self-end sm:self-center">
                    {item._executionTimeMs !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-cyan-400" /> {item._executionTimeMs}ms
                      </span>
                    )}
                    <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Just now"}</span>
                    <span className="text-cyan-400 font-semibold hover:underline">View Details →</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#1f2e4d] p-8 text-center space-y-2">
            <Shield className="mx-auto h-8 w-8 text-slate-500" />
            <div className="text-sm font-semibold text-slate-300">No session findings recorded yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run any defensive tool above or click a "Quick Sample" button to generate an instant security report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
