import React from 'react';
import { HardDrive, Server, Cpu, Zap } from 'lucide-react';

interface GpuStatsGridProps {
  stats: {
    activeModelsCount: number;
    sumUsedVram: number;
    sumTotalVram: number;
    totalVramAllocPercent: number;
    avgUtil: number;
    totalPower: number;
  };
  totalStandbyModels: number;
}

export const GpuStatsGrid: React.FC<GpuStatsGridProps> = ({ stats, totalStandbyModels }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* VRAM allocated */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Aggregate VRAM Allocated</span>
          <div className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {stats.sumUsedVram} / {stats.sumTotalVram} <span className="text-xs text-slate-500 font-sans font-normal">GB</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-indigo-600 block mt-1">
            {stats.totalVramAllocPercent}% across cluster pool
          </span>
        </div>
        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
          <HardDrive className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* Loaded Models */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Active Weights Live</span>
          <div className="text-2xl font-extrabold font-display text-indigo-600 mt-1">
            {stats.activeModelsCount} Models
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">
            {totalStandbyModels} candidates standby in registry
          </span>
        </div>
        <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
          <Server className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* Global Cluster Load */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Avg GPU Utilisation</span>
          <div className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {stats.avgUtil}%
          </div>
          <span className="text-[10px] font-mono font-semibold text-emerald-600 block mt-1">
            Cluster compute threads streaming
          </span>
        </div>
        <div className="bg-emerald-50 p-3 rounded-2xl text-teal-650">
          <Cpu className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* Energy usage */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Cluster Power Output</span>
          <div className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {stats.totalPower} <span className="text-xs text-slate-500 font-sans font-normal">Watts</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">
            Dynamic cooling loops active
          </span>
        </div>
        <div className="bg-amber-50 p-3 rounded-2xl text-amber-500">
          <Zap className="w-5.5 h-5.5" />
        </div>
      </div>
    </div>
  );
};
