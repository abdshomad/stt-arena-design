import React from 'react';
import { Info } from 'lucide-react';

interface ScatterTooltipProps {
  active?: boolean;
  payload?: any[];
  werMetric: 'english' | 'indonesian' | 'mumbled';
  pinnedModelIds: string[];
}

export default function ScatterTooltip({ 
  active, 
  payload, 
  werMetric, 
  pinnedModelIds 
}: ScatterTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const model = payload[0].payload;
  const isUnsupportedIndo = werMetric === 'indonesian' && model.werIndonesian === 99;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xl border border-slate-700/50 max-w-[280px] font-sans text-xs space-y-2.5 z-10">
      <div className="border-b border-white/10 pb-1.5">
        <div className="flex items-center justify-between gap-2 block">
          <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-mono font-bold tracking-wide uppercase ${
            model.isCloud 
              ? 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/30' 
              : 'bg-indigo-500/20 text-indigo-350 border border-indigo-500/30'
          }`}>
            {model.isCloud ? 'Cloud SaaS API' : 'Local Host'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {model.license === 'Proprietary' ? 'Proprietary' : `${model.license}`}
          </span>
        </div>
        <h4 className="font-semibold text-white text-sm mt-1 truncate">{model.name}</h4>
        <span className="text-[10px] text-slate-405 font-mono">id: {model.id}</span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-400">Processing Latency:</span>
          <span className="font-semibold text-slate-100">{model.latencyMs} ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Selected WER:</span>
          <span className={`font-semibold ${isUnsupportedIndo ? 'text-rose-400' : 'text-amber-400'}`}>
            {isUnsupportedIndo ? 'Unsupported' : `${model.y.toFixed(1)}%`}
          </span>
        </div>
        <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5">
          <span className="text-slate-400">{model.isCloud ? 'Cloud Cost:' : 'Local VRAM Requirement:'}</span>
          <span className="font-semibold text-slate-200">
            {model.isCloud 
              ? `$${model.costPerMillionWords.toFixed(2)}/M Words` 
              : `${model.vramRequiredGb.toFixed(1)} GB`
            }
          </span>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
        <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        <span>Click bubble to {pinnedModelIds.includes(model.id) ? 'Unpin' : 'Pin to Compare'}</span>
      </div>
    </div>
  );
}
