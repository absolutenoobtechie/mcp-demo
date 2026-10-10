import React, { useState, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  Loader2,
  Info,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { TOOL_SAMPLES } from "../data/samples";
import ResultCard from "./ResultCard";

export default function ToolPanel({
  tool,
  onRunTool,
  isRunning,
  error,
  lastResult,
  onClearResult,
}) {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState(null);

  // Initialize or reset form values when tool changes
  useEffect(() => {
    setFormData({});
    setActiveSampleId(null);
    setShowPassword(false);
  }, [tool.name]);

  // Handle Load Sample
  const handleLoadSample = (sample) => {
    setFormData(sample.payload);
    setActiveSampleId(sample.id);
  };

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setActiveSampleId(null);
  };

  // Submit Handler
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isRunning) return;
    onRunTool(tool.name, formData);
  };

  // Keyboard shortcut: Ctrl+Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const samples = TOOL_SAMPLES[tool.name] || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Tool Header */}
      <div className="rounded-xl border border-[#1f2e4d] bg-[#080d1a] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-[11px] font-mono text-cyan-300">
                {tool.category || "DEFENSIVE TOOL"}
              </span>
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                mcp:{tool.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {tool.title || tool.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300">{tool.description}</p>
          </div>

          {/* Defensive Guarantee Pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-cyan-900/40 bg-cyan-950/30 px-3 py-1.5 text-xs text-cyan-300">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>Defensive Guarantee</span>
          </div>
        </div>

        {/* Demo Samples Selector Bar */}
        {samples.length > 0 && (
          <div className="mt-5 border-t border-[#1f2e4d] pt-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Load Pre-configured Demo Samples:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    activeSampleId === sample.id
                      ? "border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-glow-cyan"
                      : "border-[#1f2e4d] bg-[#0c1427] text-slate-300 hover:border-slate-500 hover:text-white"
                  }`}
                  title={sample.description}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Form Panel */}
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="rounded-xl border border-[#1f2e4d] bg-[#080d1a] p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1f2e4d] pb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" /> Input Payload Specification
          </span>
          <span className="text-xs font-mono text-slate-500">Press Ctrl + Enter to run</span>
        </div>

        {/* Dynamic Fields based on tool schema */}

        {/* 1. SECRETS SCAN */}
        {tool.name === "scan_secrets" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="secrets-text" className="font-semibold text-slate-200">
                Text / Source Code / Configuration to Scan:
              </label>
              <span className="text-slate-400 font-mono text-[11px]">
                {(formData.text || "").length} characters
              </span>
            </div>
            <textarea
              id="secrets-text"
              rows={8}
              value={formData.text || ""}
              onChange={(e) => handleInputChange("text", e.target.value)}
              placeholder={`Paste credentials, config snippets, or code here...\n\nExample:\nOPENAI_API_KEY=sk-1234567890abcdefghijkl\nAWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF\nGITHUB_TOKEN=ghp_1234567890abcdefghijkl`}
              className="w-full rounded-lg border border-[#1f2e4d] bg-[#050811] p-3.5 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3 w-3 text-cyan-400" />
              <span>Scans for OpenAI, AWS, GitHub PATs, Slack, and private keys. Matched values are redacted.</span>
            </div>
          </div>
        )}

        {/* 2. CVE LOOKUP */}
        {tool.name === "lookup_cve" && (
          <div className="space-y-2">
            <label htmlFor="cve-id-input" className="block text-xs font-semibold text-slate-200">
              NVD CVE Identifier:
            </label>
            <input
              id="cve-id-input"
              type="text"
              value={formData.cve_id || ""}
              onChange={(e) => handleInputChange("cve_id", e.target.value)}
              placeholder="e.g. CVE-2024-3094, CVE-2021-44228"
              className="w-full rounded-lg border border-[#1f2e4d] bg-[#050811] px-3.5 py-2.5 font-mono text-sm text-cyan-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
            <p className="text-[11px] text-slate-400">
              Format: <code>CVE-YYYY-NNNN</code>. Queries NIST NVD v2.0 API with CVSS base severity score.
            </p>
          </div>
        )}

        {/* 3. SEARCH CVES */}
        {tool.name === "search_cves" && (
          <div className="space-y-2">
            <label htmlFor="cve-keyword-input" className="block text-xs font-semibold text-slate-200">
              Defensive Keyword Search:
            </label>
            <input
              id="cve-keyword-input"
              type="text"
              value={formData.keyword || ""}
              onChange={(e) => handleInputChange("keyword", e.target.value)}
              placeholder="e.g. openssl ssh, runc container, log4j remote"
              className="w-full rounded-lg border border-[#1f2e4d] bg-[#050811] px-3.5 py-2.5 font-mono text-sm text-cyan-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
            <p className="text-[11px] text-slate-400">
              Queries NVD vulnerability descriptions and advisory summaries matching defensive keywords.
            </p>
          </div>
        )}

        {/* 4. AUTH LOG ANALYZER */}
        {tool.name === "analyze_auth_log" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="auth-log-input" className="font-semibold text-slate-200">
                Authentication Log Entries (sshd / syslog):
              </label>
              <span className="text-slate-400 font-mono text-[11px]">
                {(formData.log_text || "").split("\n").filter(Boolean).length} lines
              </span>
            </div>
            <textarea
              id="auth-log-input"
              rows={8}
              value={formData.log_text || ""}
              onChange={(e) => handleInputChange("log_text", e.target.value)}
              placeholder={`Oct 10 10:00:01 demo sshd[1001]: Failed password for invalid user admin from 45.67.89.10 port 52101 ssh2\nOct 10 10:00:02 demo sshd[1002]: Failed password for invalid user admin from 45.67.89.10 port 52102 ssh2`}
              className="w-full rounded-lg border border-[#1f2e4d] bg-[#050811] p-3.5 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
            <p className="text-[11px] text-slate-400">
              Parses SSH success/failure events, flags brute-force sources (≥ 5 failures), and isolates anomalous public IPs.
            </p>
          </div>
        )}

        {/* 5. CHECK PASSWORD BREACH */}
        {tool.name === "check_password_breach" && (
          <div className="space-y-2">
            <label htmlFor="password-input" className="block text-xs font-semibold text-slate-200">
              Password to Check (k-Anonymity Verified):
            </label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter password to verify against billion-credential breach database"
                className="w-full rounded-lg border border-[#1f2e4d] bg-[#050811] px-3.5 py-2.5 pr-10 font-mono text-sm text-cyan-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="rounded-md border border-cyan-900/40 bg-cyan-950/20 p-2.5 text-[11px] text-cyan-300 flex items-start gap-2">
              <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guarantee:</strong> Passwords are never sent across the internet. Only the first 5 characters of the SHA-1 hash are transmitted to HaveIBeenPwned range API.
              </span>
            </div>
          </div>
        )}

        {/* 6. SCORE URL */}
        {tool.name === "score_url" && (
          <div className="space-y-2">
            <label htmlFor="url-input" className="block text-xs font-semibold text-slate-200">
              Target URL to Evaluate:
            </label>
            <input
              id="url-input"
              type="text"
              value={formData.url || ""}
              onChange={(e) => handleInputChange("url", e.target.value)}
              placeholder="https://example.com/login or http://192.168.1.50/wp-admin"
              className="w-full rounded-lg border border-[#1f2e4d] bg-[#050811] px-3.5 py-2.5 font-mono text-sm text-cyan-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
            <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 p-2.5 text-[11px] text-emerald-300 flex items-start gap-2">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>SSRF Protection:</strong> Purely local heuristic evaluation (punycode, shorteners, suspicious TLDs, embedded credentials, odd IPs). Never performs untrusted HTTP requests.
              </span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Execution Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between border-t border-[#1f2e4d] pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData({});
              setActiveSampleId(null);
              onClearResult();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[#1f2e4d] px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear Form
          </button>

          <button
            type="submit"
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Defensive Scan...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Run Security Scan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Skeleton / Radar */}
      {isRunning && (
        <div className="rounded-xl border border-cyan-500/40 bg-[#080d1a] p-8 text-center space-y-3 shadow-glow-cyan animate-pulse">
          <div className="flex justify-center">
            <div className="relative h-12 w-12 rounded-full border-2 border-cyan-400 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-cyan-400 animate-ping" />
            </div>
          </div>
          <div className="font-mono text-sm font-semibold text-cyan-300">
            Analyzing security indicators via FastMCP...
          </div>
          <p className="text-xs text-slate-400">
            Applying defensive verification filters & k-anonymity checks
          </p>
        </div>
      )}

      {/* Result Card */}
      {!isRunning && lastResult && (
        <ResultCard result={lastResult} />
      )}
    </div>
  );
}
