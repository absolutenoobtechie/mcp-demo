import React from "react";
import { X } from "lucide-react";
import ResultCard from "./ResultCard";

export default function FindingDetailModal({ finding, onClose }) {
  if (!finding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1f2e4d] bg-[#070b17] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2e4d]">
          <div>
            <h2 className="text-lg font-bold text-white">Historical Finding Details</h2>
            <p className="text-xs text-slate-400 font-mono">
              Recorded at {finding.timestamp ? new Date(finding.timestamp).toLocaleString() : "Session run"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <ResultCard result={finding} />
        </div>
      </div>
    </div>
  );
}
