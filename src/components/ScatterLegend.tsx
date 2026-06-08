import React from 'react';
import { Layers } from 'lucide-react';

export default function ScatterLegend() {
  return (
    <div className="lg:col-span-3 bg-slate-50/55 rounded-xl p-4 border border-slate-100 flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">Legend Matrix</h4>
        
        <div className="space-y-2 text-xs font-sans">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/60 border border-emerald-500 flex-shrink-0 inline-block" />
            <div>
              <span className="font-semibold text-slate-800 block leading-tight">Cloud SaaS / Managed</span>
              <span className="text-[10px] text-slate-400">Serverless execution; no local hardware overhead</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/60 border border-indigo-500 flex-shrink-0 inline-block" />
            <div>
              <span className="font-semibold text-slate-800 block leading-tight">Local Self-Hosted</span>
              <span className="text-[10px] text-slate-400">Runs directly on local or cloud-GPU (CUDA)</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/50 pt-3 space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Bubble Size (Z-Axis)</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Indicates the peak model <b>VRAM footprint</b>. Smaller bubbles indicate edge-viable nodes. Larger bubbles correspond to massive architectures requiring dedicated server GPUs (T4 &lt; A10G &lt; A100).
          </p>
        </div>
      </div>

      <div className="bg-indigo-50/35 border border-indigo-100/30 rounded-lg p-2.5 text-[10px] text-indigo-850 leading-relaxed font-sans mt-auto">
        💡 <b>Insight:</b> Click any bubble directly in the chart to add or remove that engine from the active pinning <b>Performance Comparison Matrix</b>.
      </div>
    </div>
  );
}
