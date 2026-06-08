import React from 'react';
import { Terminal } from 'lucide-react';
import { GpuLogMsg } from '../types/gpu';

interface GpuOrchestratorTerminalProps {
  logs: GpuLogMsg[];
  onClear: () => void;
}

export const GpuOrchestratorTerminal: React.FC<GpuOrchestratorTerminalProps> = ({ logs, onClear }) => {
  return (
    <div className="bg-[#0f172a] text-slate-200 border border-slate-800 rounded-2xl p-4 h-[350px] lg:h-[400px] flex flex-col justify-between shadow-inner">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Terminal className="text-emerald-400 w-4 h-4" />
          <span>Orchestrator Terminal</span>
        </div>
        <button
          onClick={onClear}
          className="text-[10.5px] font-mono text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
        >
          CLEAR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-[10.5px] space-y-2 py-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="text-center text-slate-600 py-24 italic">
            Terminal buffer empty. Orchestrate a model to spawn logs.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="leading-relaxed flex items-start gap-1.5 border-b border-slate-800/20 pb-1">
              <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              <span
                className={`${
                  log.level === 'success'
                    ? 'text-emerald-400'
                    : log.level === 'warning'
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
