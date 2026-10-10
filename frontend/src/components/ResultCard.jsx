import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Shield,
  FileCode,
  ExternalLink,
  Lock,
  Globe,
  Terminal,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ResultCard({ result }) {
  const [showJson, setShowJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!result) return null;

  const { tool, risk, reason, details = {}, _executionTimeMs, _source } = result;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopySummary = () => {
    const summary = `[SecOps MCP] Tool: ${tool} | Risk: ${risk.toUpperCase()} | Reason: ${reason}`;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Color mappings
  const riskConfig = {
    high: {
      badgeBg: "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-glow-rose",
      badgeIcon: AlertOctagon,
      label: "HIGH RISK",
      borderColor: "border-rose-900/40",
      accentBg: "bg-rose-950/20",
    },
    med: {
      badgeBg: "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-glow-amber",
      badgeIcon: AlertTriangle,
      label: "MEDIUM RISK",
      borderColor: "border-amber-900/40",
      accentBg: "bg-amber-950/20",
    },
    low: {
      badgeBg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-glow-emerald",
      badgeIcon: CheckCircle2,
      label: "LOW RISK",
      borderColor: "border-emerald-900/40",
      accentBg: "bg-emerald-950/20",
    },
  }[risk] || {
    badgeBg: "bg-slate-800 border-slate-700 text-slate-300",
    badgeIcon: Shield,
    label: "UNKNOWN",
    borderColor: "border-slate-800",
    accentBg: "bg-slate-900/40",
  };

  const RiskIcon = riskConfig.badgeIcon;

  return (
    <div className={`mt-6 rounded-xl border ${riskConfig.borderColor} bg-[#080d1a] p-5 shadow-2xl transition-all`}>
      {/* Result Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f2e4d] pb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${riskConfig.badgeBg}`}>
            <RiskIcon className="h-4 w-4" />
            <span>{riskConfig.label}</span>
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Tool Assessment
            </span>
            <div className="text-sm font-semibold text-slate-200">
              <code>{tool}</code>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {_executionTimeMs !== undefined && (
            <span className="flex items-center gap-1 font-mono text-slate-400 bg-[#0d1527] px-2.5 py-1 rounded border border-[#1f2e4d]">
              <Clock className="h-3 w-3 text-cyan-400" /> {_executionTimeMs}ms
            </span>
          )}
          {_source && (
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase border ${
              _source === "live_api"
                ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                : "bg-amber-950/40 border-amber-800/40 text-amber-300"
            }`}>
              {_source === "live_api" ? "Live Server" : "Mock Adapter"}
            </span>
          )}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 rounded border border-[#1f2e4d] bg-[#0c1427] px-2.5 py-1 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            title="Copy one-line summary"
          >
            {copiedSummary ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>Summary</span>
          </button>
        </div>
      </div>

      {/* Primary Reason Banner */}
      <div className={`mt-4 rounded-lg border border-[#1f2e4d] ${riskConfig.accentBg} p-3.5`}>
        <div className="text-xs font-mono uppercase text-slate-400 mb-1">Finding Reason:</div>
        <p className="text-sm font-medium text-slate-100">{reason}</p>
      </div>

      {/* Visual Findings Breakdown per Tool */}
      <div className="mt-5 space-y-4">
        {/* 1. SECRETS SCAN */}
        {tool === "scan_secrets" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-2.5">
                <span className="text-slate-400">Total Secrets Detected</span>
                <div className="mt-1 font-mono text-lg font-bold text-rose-400">{details.count ?? 0}</div>
              </div>
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-2.5">
                <span className="text-slate-400">Scanned Characters</span>
                <div className="mt-1 font-mono text-lg font-bold text-slate-200">{details.scanned_characters ?? 0}</div>
              </div>
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-2.5 col-span-2 sm:col-span-1">
                <span className="text-slate-400">Privacy Status</span>
                <div className="mt-1 font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Values Omitted
                </div>
              </div>
            </div>

            {details.findings && details.findings.length > 0 ? (
              <div className="rounded-lg border border-[#1f2e4d] bg-[#050811] overflow-hidden">
                <div className="px-3 py-2 bg-[#090f1f] border-b border-[#1f2e4d] text-xs font-semibold text-slate-300">
                  Detected Credential Matches (Line & Type)
                </div>
                <div className="divide-y divide-[#1f2e4d]/60 text-xs font-mono">
                  {details.findings.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-[#0c1427]">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#1a2744] px-2 py-0.5 text-cyan-300">Line {item.line}</span>
                        <span className="font-semibold text-slate-200 uppercase">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 italic">[value redacted]</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.risk === "high" ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-amber-950 text-amber-300"
                        }`}>
                          {item.risk}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/15 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero hardcoded API keys, tokens, or private keys detected in the scanned text.</span>
              </div>
            )}
          </div>
        )}

        {/* 2 & 3. CVE LOOKUP & SEARCH */}
        {(tool === "lookup_cve" || tool === "search_cves") && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>NVD Vulnerability Matches ({details.matches ? details.matches.length : 0})</span>
              {details.keyword && <span className="font-mono text-cyan-400">Query: "{details.keyword}"</span>}
              {details.cve_id && <span className="font-mono text-cyan-400">ID: {details.cve_id}</span>}
            </div>

            {details.matches && details.matches.length > 0 ? (
              <div className="space-y-3">
                {details.matches.map((cve, idx) => (
                  <div key={idx} className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-sm font-bold text-cyan-300 hover:underline flex items-center gap-1"
                        >
                          {cve.id} <ExternalLink className="h-3 w-3 text-cyan-400" />
                        </a>
                        {cve.severity && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            cve.severity === "CRITICAL"
                              ? "bg-rose-950 border border-rose-800 text-rose-300"
                              : cve.severity === "HIGH"
                              ? "bg-rose-900/50 border border-rose-700/50 text-rose-300"
                              : cve.severity === "MEDIUM"
                              ? "bg-amber-950 border border-amber-800 text-amber-300"
                              : "bg-emerald-950 text-emerald-300"
                          }`}>
                            {cve.severity}
                          </span>
                        )}
                      </div>
                      {cve.cvss_score !== null && cve.cvss_score !== undefined && (
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-slate-400">CVSS Base:</span>
                          <span className="rounded bg-[#1a2744] px-2 py-0.5 font-bold text-cyan-300">
                            {cve.cvss_score.toFixed(1)} / 10.0
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{cve.description}</p>

                    <div className="flex flex-wrap gap-4 text-[11px] font-mono text-slate-400 pt-1 border-t border-[#1f2e4d]/50">
                      {cve.published && <span>Published: {cve.published.slice(0, 10)}</span>}
                      {cve.last_modified && <span>Updated: {cve.last_modified.slice(0, 10)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-[#0c1427] p-3 text-xs text-slate-400">
                No matching CVE vulnerabilities returned from NVD repository.
              </div>
            )}
          </div>
        )}

        {/* 4. AUTH LOG ANALYZER */}
        {tool === "analyze_auth_log" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-2.5">
                <span className="text-slate-400">Parsed Auth Lines</span>
                <div className="mt-1 font-mono text-lg font-bold text-slate-200">
                  {details.parsed_auth_lines ?? 0}
                </div>
              </div>
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-2.5">
                <span className="text-slate-400">Failed Logins</span>
                <div className="mt-1 font-mono text-lg font-bold text-rose-400">
                  {details.failed_attempts ?? 0}
                </div>
              </div>
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-2.5 col-span-2 sm:col-span-1">
                <span className="text-slate-400">Successful Logins</span>
                <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  {details.successful_logins ?? 0}
                </div>
              </div>
            </div>

            {/* Brute force alert */}
            {details.brute_force_sources && details.brute_force_sources.length > 0 && (
              <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-rose-300 mb-1">
                  <AlertOctagon className="h-4 w-4 text-rose-400" />
                  <span>Brute-Force Attack Sources Detected (Threshold ≥ 5 failures):</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {details.brute_force_sources.map((ip) => (
                    <span key={ip} className="rounded bg-rose-900/60 border border-rose-700/60 px-2 py-1 font-mono font-bold text-rose-200">
                      {ip} ({details.failures_by_ip?.[ip] || "5+"} attempts)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Public odd IPs */}
            {details.odd_ips && details.odd_ips.length > 0 && (
              <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                  <Globe className="h-4 w-4 text-amber-400" />
                  <span>Public / Non-Private IP Sources:</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {details.odd_ips.map((ip) => (
                    <span key={ip} className="rounded bg-amber-900/40 border border-amber-700/40 px-2 py-0.5 font-mono text-amber-200">
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. PASSWORD BREACH CHECK */}
        {tool === "check_password_breach" && (
          <div className="space-y-3">
            <div className={`rounded-xl border p-4 text-center ${
              details.breached
                ? "border-rose-800/60 bg-rose-950/30 text-rose-200"
                : "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
            }`}>
              <div className="flex justify-center mb-2">
                {details.breached ? (
                  <AlertOctagon className="h-8 w-8 text-rose-400" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                )}
              </div>
              <div className="text-lg font-bold">
                {details.breached ? "EXPOSED IN HISTORICAL BREACHES" : "CLEAN: NO BREACH EXPOSURE"}
              </div>
              <div className="text-xs font-mono mt-1 opacity-90">
                {details.breached
                  ? `Found in ${details.occurrences ? details.occurrences.toLocaleString() : "multiple"} documented public breach dumps.`
                  : "Hash prefix not found in HaveIBeenPwned billion-credential database."}
              </div>
            </div>

            <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-3 text-xs font-mono space-y-1">
              <div className="text-slate-400 font-sans font-semibold">Privacy & k-Anonymity Guarantee:</div>
              <div className="text-slate-300">
                Local SHA-1 Prefix Sent: <span className="font-bold text-cyan-400">{details.sha1_prefix || "Local"}</span> (Only first 5 chars)
              </div>
              <div className="text-[11px] text-slate-400">
                The full password was never logged, cached, or transmitted across the network.
              </div>
            </div>
          </div>
        )}

        {/* 6. URL SCORER */}
        {tool === "score_url" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-3 text-center sm:text-left">
                <span className="text-slate-400">Phishing Heuristic Score</span>
                <div className="mt-1 font-mono text-2xl font-bold flex items-baseline gap-1">
                  <span className={details.score >= 60 ? "text-rose-400" : details.score >= 20 ? "text-amber-400" : "text-emerald-400"}>
                    {details.score ?? 0}
                  </span>
                  <span className="text-slate-500 text-xs">/ 100</span>
                </div>
              </div>

              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-3">
                <span className="text-slate-400">Hostname / Protocol</span>
                <div className="mt-1 font-mono text-xs font-semibold text-cyan-300 truncate">
                  {details.hostname || "N/A"}
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  Protocol: {details.scheme || "N/A"}
                </div>
              </div>

              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-3">
                <span className="text-slate-400">SSRF Protection</span>
                <div className="mt-1 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> No Content Fetched
                </div>
              </div>
            </div>

            {/* Heuristic flags */}
            {details.flags && details.flags.length > 0 && (
              <div className="rounded-lg border border-[#1f2e4d] bg-[#0c1427] p-3">
                <span className="text-xs font-semibold text-slate-300">Triggered Phishing Heuristics:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {details.flags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 font-mono text-[11px] text-rose-300"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Raw JSON Area */}
      <div className="mt-5 border-t border-[#1f2e4d] pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
          >
            {showJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{showJson ? "Hide Raw JSON Output" : "View Collapsible Raw JSON"}</span>
          </button>

          {showJson && (
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {copiedJson ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedJson ? "Copied!" : "Copy JSON"}</span>
            </button>
          )}
        </div>

        {showJson && (
          <div className="mt-2.5 rounded-lg border border-[#1a2744] bg-[#050811] p-3 font-mono text-xs text-cyan-300/90 overflow-x-auto max-h-80">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
