import React, { useState } from "react";
import {
  Shield,
  Activity,
  Cpu,
  RefreshCw,
  Settings,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Command,
} from "lucide-react";
import { getBaseUrl, setBaseUrl } from "../api";

export default function Navbar({
  isMockMode,
  setIsMockMode,
  isCheckingHealth,
  apiOnline,
  checkHealth,
  stats,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState(getBaseUrl());

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setBaseUrl(customUrl);
    setShowSettings(false);
    checkHealth();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1f2e4d] bg-[#070b17]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-glow-cyan">
            <Shield className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-wider text-slate-100 uppercase">
                SecOps <span className="text-cyan-400">MCP</span> Console
              </span>
              <span className="rounded bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-300">
                v1.0 • DEFENSIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI Agent Security Tool Bridge • FastMCP Protocol
            </p>
          </div>
        </div>

        {/* Center: Live Stats Counters */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-[#1f2e4d] bg-[#0c1427] px-2.5 py-1 text-xs">
            <span className="text-slate-400">Total Scans:</span>
            <span className="font-mono font-semibold text-slate-100">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-rose-900/40 bg-rose-950/30 px-2.5 py-1 text-xs">
            <AlertOctagon className="h-3 w-3 text-rose-400" />
            <span className="text-rose-300 font-mono font-semibold">{stats.high}</span>
            <span className="text-rose-400/80">High</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-amber-900/40 bg-amber-950/30 px-2.5 py-1 text-xs">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span className="font-mono font-semibold text-amber-300">{stats.med}</span>
            <span className="text-amber-400/80">Med</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-900/40 bg-emerald-950/30 px-2.5 py-1 text-xs">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span className="font-mono font-semibold text-emerald-300">{stats.low}</span>
            <span className="text-emerald-400/80">Low</span>
          </div>
        </div>

        {/* Right: API Mode & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono transition-all ${
              isMockMode
                ? "border-amber-500/40 bg-amber-950/30 text-amber-300 shadow-glow-amber"
                : apiOnline
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 shadow-glow-emerald"
                : "border-rose-500/40 bg-rose-950/30 text-rose-300"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isMockMode
                  ? "bg-amber-400 animate-pulse"
                  : apiOnline
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-rose-400"
              }`}
            />
            <span className="hidden sm:inline">
              {isMockMode
                ? "Mock Adapter (Offline / Demo)"
                : apiOnline
                ? "Connected: Live API"
                : "Backend Offline"}
            </span>
            <span className="sm:hidden">{isMockMode ? "Mock" : apiOnline ? "Live" : "Offline"}</span>
          </div>

          {/* Toggle Live / Mock Mode */}
          <button
            onClick={() => setIsMockMode(!isMockMode)}
            title={isMockMode ? "Switch to Live FastAPI Bridge" : "Switch to Local Mock Adapter"}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isMockMode
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50"
                : "border-[#1f2e4d] bg-[#0d1427] text-slate-300 hover:border-slate-600 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">{isMockMode ? "Use Live API" : "Force Mock"}</span>
          </button>

          {/* Ping / Refresh Backend */}
          <button
            onClick={checkHealth}
            disabled={isCheckingHealth}
            title="Ping API Server"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f2e4d] bg-[#0d1427] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Configure API Endpoint"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f2e4d] bg-[#0d1427] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Dropdown Drawer */}
      {showSettings && (
        <div className="border-t border-[#1f2e4d] bg-[#090e1d] p-4 text-xs shadow-2xl animate-in slide-in-from-top-2">
          <form onSubmit={handleSaveUrl} className="mx-auto max-w-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-cyan-400" /> API Gateway Endpoint Configuration
              </span>
              <span className="text-slate-400">Default: http://localhost:8000</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 rounded-md border border-[#1f2e4d] bg-[#050811] px-3 py-1.5 font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-cyan-600 px-3 py-1.5 font-semibold text-white hover:bg-cyan-500"
              >
                Save & Connect
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomUrl("http://localhost:8000");
                  setBaseUrl("http://localhost:8000");
                  setShowSettings(false);
                  checkHealth();
                }}
                className="rounded-md border border-[#1f2e4d] px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Reset Default
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              CORS is enabled on the FastAPI bridge for origin <code>http://localhost:5173</code>. If the local backend is not currently running, the console operates in high-fidelity Mock Adapter mode with full local security emulation.
            </p>
          </form>
        </div>
      )}
    </header>
  );
}
