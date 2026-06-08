import React from 'react';
import { GPUModel, ManagedModel } from '../types/gpu';
import { Cpu, Thermometer, Zap, Activity, Trash2, ArrowRight } from 'lucide-react';

interface GpuCardProps {
  gpu: GPUModel;
  loadedModels: ManagedModel[];
  allGpus: GPUModel[];
  onUnloadModel: (modelId: string) => void;
  onMoveModel: (modelId: string, targetGpuId: string) => void;
}

export const GpuCard: React.FC<GpuCardProps> = ({
  gpu,
  loadedModels,
  allGpus,
  onUnloadModel,
  onMoveModel,
}) => {
  const vramPercent = (gpu.vramUsedGb / gpu.vramTotalGb) * 100;
  
  // Dynamic color for temperature
  const getTempColor = (temp: number) => {
    if (temp < 50) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (temp < 75) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  // Dynamic color for allocation
  const getVramProgressColor = (percent: number) => {
    if (percent < 60) return 'bg-emerald-500';
    if (percent < 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div
      id={`gpu-card-${gpu.id}`}
      className="bg-white border border-slate-205/85 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between h-full relative"
    >
      <div className="space-y-4">
        {/* GPU Identification Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-950 text-sm tracking-tight leading-none">
                {gpu.name}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">NODE ID: {gpu.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${gpu.utilization > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
              {gpu.utilization > 0 ? 'Active' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono text-[10.5px]">
          {/* Temperature */}
          <div className="flex flex-col items-center py-1 bg-white border border-slate-200/50 rounded-lg">
            <Thermometer className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
            <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Temp</span>
            <span className="font-bold text-slate-800 mt-0.5">{gpu.temperature}°C</span>
          </div>
          
          {/* Power Draw */}
          <div className="flex flex-col items-center py-1 bg-white border border-slate-200/50 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
            <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Power</span>
            <span className="font-bold text-slate-800 mt-0.5">{gpu.powerUsageW}W</span>
          </div>

          {/* Util % */}
          <div className="flex flex-col items-center py-1 bg-white border border-slate-200/50 rounded-lg">
            <Activity className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
            <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Util %</span>
            <span className={`font-bold mt-0.5 ${gpu.utilization > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
              {gpu.utilization}%
            </span>
          </div>
        </div>

        {/* VRAM Utilization Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-500">VRAM Allocation</span>
            <span className="font-bold text-slate-800">
              {gpu.vramUsedGb.toFixed(1)} / {gpu.vramTotalGb} GB ({vramPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getVramProgressColor(vramPercent)}`}
              style={{ width: `${vramPercent}%` }}
            />
          </div>
        </div>

        {/* Active Loaded Models */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-[11px] font-sans font-bold uppercase text-slate-400 tracking-wider">
            Active Loaded Models ({loadedModels.length})
          </h4>

          {loadedModels.length === 0 ? (
            <div className="py-5 text-center text-slate-400 bg-slate-50/55 rounded-xl border border-dashed border-slate-200">
              <span className="text-xs font-sans">No Models Loaded. Idle Mode.</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Use below catalog models to spin weights.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {loadedModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white border border-slate-150/70 p-2.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 block truncate">{model.name}</span>
                    <span className="text-[10px] font-mono text-slate-450">
                      Capacity: {model.sizeGb.toFixed(1)} GB | {model.parameters}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {/* Inline move selector */}
                    <div className="group relative">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition-colors cursor-pointer" title="Move model immediately">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <div className="hidden group-hover:block hover:block absolute right-0 bottom-full mb-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg py-1 w-32 z-30 overflow-hidden border border-slate-800">
                        <div className="px-2 py-0.5 border-b border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[8px]">
                          Target Host GPU
                        </div>
                        {allGpus
                          .filter((g) => g.id !== gpu.id)
                          .map((g) => {
                            const hasSpace = g.vramTotalGb - g.vramUsedGb >= model.sizeGb;
                            return (
                              <button
                                key={g.id}
                                disabled={!hasSpace}
                                onClick={() => onMoveModel(model.id, g.id)}
                                className={`w-full text-left px-2 py-1 transition-colors hover:bg-slate-850 truncate ${
                                  hasSpace ? 'text-emerald-400 cursor-pointer' : 'text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {g.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Inline Unload */}
                    <button
                      onClick={() => onUnloadModel(model.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Unload from compute pool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
