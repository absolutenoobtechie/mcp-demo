import React from "react";
import {
  LayoutDashboard,
  KeyRound,
  Search,
  FolderSearch,
  ShieldAlert,
  Lock,
  Globe,
  Shield,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Info,
} from "lucide-react";

const ICON_MAP = {
  scan_secrets: KeyRound,
  lookup_cve: Search,
  search_cves: FolderSearch,
  analyze_auth_log: ShieldAlert,
  check_password_breach: Lock,
  score_url: Globe,
};

export default function Sidebar({
  tools,
  activeView,
  setActiveView,
  lastRunsByTool,
  isOpen,
  setIsOpen,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 flex w-72 flex-col border-r border-[#1f2e4d] bg-[#070b17] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Dashboard item */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Platform Views
            </div>
            <button
              onClick={() => {
                setActiveView("dashboard");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                activeView === "dashboard"
                  ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-glow-cyan"
                  : "text-slate-300 hover:bg-[#0f172a] hover:text-white"
              }`}
            >
              <LayoutDashboard className={`h-4 w-4 ${activeView === "dashboard" ? "text-cyan-400" : "text-slate-400"}`} />
              <div className="flex-1 text-left">
                <div className="font-semibold">Dashboard Overview</div>
                <div className="text-[10px] text-slate-400">Session metrics & finding history</div>
              </div>
            </button>
          </div>

          {/* Tools List */}
          <div>
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Defensive MCP Tools ({tools.length})
              </span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-400 font-mono">
                MCP Stdio
              </span>
            </div>

            <div className="space-y-1">
              {tools.map((tool) => {
                const IconComponent = ICON_MAP[tool.name] || Terminal;
                const isActive = activeView === tool.name;
                const lastRun = lastRunsByTool[tool.name];

                return (
                  <button
                    key={tool.name}
                    onClick={() => {
                      setActiveView(tool.name);
                      setIsOpen(false);
                    }}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-glow-cyan"
                        : "text-slate-300 hover:bg-[#0f172a] hover:text-white border border-transparent"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                        isActive
                          ? "border-cyan-500/50 bg-cyan-900/40 text-cyan-300"
                          : "border-[#1f2e4d] bg-[#0c1427] text-slate-400 group-hover:border-slate-600 group-hover:text-cyan-300"
                      }`}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold text-slate-200 group-hover:text-white">
                          {tool.title || tool.name}
                        </span>
                        {lastRun && (
                          <span
                            className={`ml-1.5 rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                              lastRun.risk === "high"
                                ? "bg-rose-950/80 text-rose-300 border border-rose-800/40"
                                : lastRun.risk === "med"
                                ? "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40"
                            }`}
                          >
                            {lastRun.risk}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {tool.category || "Security Analysis"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Defensive Architecture Card */}
        <div className="p-3 border-t border-[#1f2e4d] bg-[#080d1a]">
          <div className="rounded-lg border border-[#1f2e4d] bg-[#0a1122] p-2.5 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Defensive Constraints</span>
            </div>
            <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-3">
              <li>Zero exploit/attack tooling</li>
              <li>Secrets redacted; hashes only</li>
              <li>HIBP k-anonymity (5-char SHA-1)</li>
              <li>Safe heuristics (No SSRF fetch)</li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
