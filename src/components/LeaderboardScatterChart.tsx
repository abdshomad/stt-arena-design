import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ReferenceArea,
  ReferenceLine,
  Cell,
  CartesianGrid
} from 'recharts';
import { Target } from 'lucide-react';
import ScatterTooltip from './ScatterTooltip';
import ScatterLegend from './ScatterLegend';

interface ScatterChartProps {
  data: any[];
  pinnedModelIds: string[];
  onPinModel: (id: string) => void;
  onHoverModel: (model: any | null) => void;
}

export default function LeaderboardScatterChart({ 
  data, 
  pinnedModelIds, 
  onPinModel,
  onHoverModel 
}: ScatterChartProps) {
  const [werMetric, setWerMetric] = useState<'english' | 'indonesian' | 'mumbled'>('english');
  const [hideUnsupportedIndo, setHideUnsupportedIndo] = useState<boolean>(true);

  // Format dataset dynamically according to selected Y-axis accuracy metric
  const formattedData = useMemo(() => {
    return data.map(model => {
      let activeWer = model.werEnglish;
      let note = '';
      
      if (werMetric === 'indonesian') {
        activeWer = model.werIndonesian;
        if (model.werIndonesian === 99) {
          note = 'Indonesian unsupported';
        }
      } else if (werMetric === 'mumbled') {
        activeWer = model.werMumbled;
      }

      // Convert VRAM size to a scale for bubble size representation (Z-Axis)
      const sizeValue = model.isCloud ? 2 : Math.max(1, model.vramRequiredGb);

      return {
        ...model,
        x: model.latencyMs,
        y: activeWer,
        z: sizeValue,
        note: note
      };
    })
    .filter(model => {
      // Filter out Indonesian unsupported models if desired
      if (werMetric === 'indonesian' && hideUnsupportedIndo && model.y === 99) {
        return false;
      }
      return true;
    });
  }, [data, werMetric, hideUnsupportedIndo]);

  const cloudData = useMemo(() => formattedData.filter(d => d.isCloud), [formattedData]);
  const localData = useMemo(() => formattedData.filter(d => !d.isCloud), [formattedData]);

  const handleNodeClick = (clickedNode: any) => {
    if (clickedNode && clickedNode.id) {
      onPinModel(clickedNode.id);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Chart Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-indigo-600" />
            <h3 className="font-display font-semibold text-slate-900 text-sm">Engine Performance & Accuracy Matrix</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Interactive multi-dimensional benchmark space. Bottom-left is the optimal zone (low word error rate & fast).
          </p>
        </div>

        {/* Dynamic Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Y-Axis (WER):</span>
          <div className="bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 inline-flex font-sans">
            <button
              onClick={() => setWerMetric('english')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                werMetric === 'english' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English Clean
            </button>
            <button
              onClick={() => setWerMetric('indonesian')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                werMetric === 'indonesian' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Indonesian Dialect
            </button>
            <button
              onClick={() => setWerMetric('mumbled')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                werMetric === 'mumbled' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Noisy / Mumbled
            </button>
          </div>
          
          {werMetric === 'indonesian' && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-650 font-sans">
              <input
                type="checkbox"
                checked={hideUnsupportedIndo}
                onChange={(e) => setHideUnsupportedIndo(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500/20"
              />
              <span>Hide Unsupported</span>
            </label>
          )}
        </div>
      </div>

      {/* Main Coordinate Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-9 h-[320px] bg-slate-50/20 border border-slate-200/40 rounded-xl p-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              
              {/* Type-safe casting of SVG parameters for Recharts elements */}
              <ReferenceArea 
                x1={0} 
                x2={400} 
                y1={0} 
                y2={5.5} 
                {...({
                  fill: "#f0fdf4",
                  fillOpacity: 0.8,
                  stroke: "#bbf7d0",
                  strokeWidth: 1,
                  strokeDasharray: "4 4"
                } as any)}
              />
              
              <ReferenceLine y={5.0} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: '5% WER threshold', fill: '#94a3b8', position: 'insideRight', fontSize: 10, fontFamily: 'monospace' }} />
              <ReferenceLine x={400} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Real-time (<400ms)', fill: '#94a3b8', position: 'insideTop', fontSize: 10, fontFamily: 'monospace' }} />

              <XAxis 
                type="number" 
                dataKey="x" 
                name="Processing Latency" 
                unit="ms" 
                domain={[50, 'auto']}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Word Error Rate" 
                unit="%" 
                domain={[1, werMetric === 'indonesian' && !hideUnsupportedIndo ? 105 : 'auto']}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <ZAxis type="number" dataKey="z" range={[80, 500]} />

              <Tooltip 
                content={<ScatterTooltip werMetric={werMetric} pinnedModelIds={pinnedModelIds} />} 
                cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} 
              />
              
              {/* Cloud Scatter Nodes */}
              <Scatter name="Cloud SaaS APIs" data={cloudData} onClick={handleNodeClick}>
                {cloudData.map((entry, index) => {
                  const isPinned = pinnedModelIds.includes(entry.id);
                  return (
                    <Cell 
                      key={`cloud-${index}`} 
                      fill="#0d9488" 
                      fillOpacity={isPinned ? 0.95 : 0.65}
                      stroke={isPinned ? '#0f172a' : '#14b8a6'}
                      strokeWidth={isPinned ? 2 : 1}
                      className="cursor-pointer transition-all duration-200 hover:scale-110"
                      onMouseEnter={() => onHoverModel(entry)}
                      onMouseLeave={() => onHoverModel(null)}
                    />
                  );
                })}
              </Scatter>

              {/* Local Scatter Nodes */}
              <Scatter name="Local Open Source" data={localData} onClick={handleNodeClick}>
                {localData.map((entry, index) => {
                  const isPinned = pinnedModelIds.includes(entry.id);
                  return (
                    <Cell 
                      key={`local-${index}`} 
                      fill="#4f46e5" 
                      fillOpacity={isPinned ? 0.95 : 0.65}
                      stroke={isPinned ? '#0f172a' : '#6366f1'}
                      strokeWidth={isPinned ? 2 : 1}
                      className="cursor-pointer transition-all duration-200 hover:scale-110"
                      onMouseEnter={() => onHoverModel(entry)}
                      onMouseLeave={() => onHoverModel(null)}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="absolute bottom-[35%] left-[8%] bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 text-emerald-800 text-[9px] font-mono select-none px-2 py-1 rounded-md hidden md:flex items-center gap-1 transition-all">
            <span>🎯</span>
            <span className="font-extrabold">Optimal Sweet Spot</span>
          </div>
        </div>

        {/* Legend Panel */}
        <ScatterLegend />
      </div>
    </div>
  );
}
