import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { HelpCircle, DollarSign, ArrowRight } from 'lucide-react';

interface TcoLineChartProps {
  currentMonthlyHours: number;
  gpuType: 'T4' | 'A10G' | 'A100';
  clusterCostPerMonth: number;
}

export const TcoLineChart: React.FC<TcoLineChartProps> = ({
  currentMonthlyHours,
  gpuType,
  clusterCostPerMonth
}) => {
  // Generate X-axis points (Monthly Volume Hours)
  const volumePoints = [200, 500, 1000, 2000, 4000, 6000, 8000, 10000, 12000, 15000, 20000];

  const chartData = useMemo(() => {
    // CAPEX Setup Overhead (Initial commissioning, networking protocols, backup provisioning)
    const CAPEX = 5000;
    
    // Average pay-per-use enterprise cloud cost: ~$11.50 per Million words
    const avgCloudRatePerMillion = 11.50;
    
    return volumePoints.map((vol) => {
      // 36 months of cumulative volumes
      const totalWordsOver3Years = (vol * 9000 * 36) / 1000000; // in millions
      const cloudCumulativeCost = Math.round(totalWordsOver3Years * avgCloudRatePerMillion);

      // Local cluster calculation
      const gpuCapacityHoursPerMonth = 14400; // 1 GPU node handles 14400 hours/month at peak RTF
      const nodesNeeded = Math.max(1, Math.ceil(vol / gpuCapacityHoursPerMonth));

      const gpuHourlyCost = gpuType === 'T4' ? 0.35 : gpuType === 'A10G' ? 1.00 : 3.50;
      const monthlyHardware = nodesNeeded * (gpuHourlyCost * 730);
      const monthlyOps = 500; // DevOps support
      const monthlyNetwork = nodesNeeded * 80; // network cost

      const localMonthlyRate = monthlyHardware + monthlyOps + monthlyNetwork;
      const localCumulativeCost = Math.round(CAPEX + (localMonthlyRate * 36));

      return {
        volumeHours: vol,
        label: `${(vol / 1000).toFixed(1)}k hr`,
        "3-Year Cloud OpEx": cloudCumulativeCost,
        "3-Year Local CapEx+OpEx": localCumulativeCost,
        nodes: nodesNeeded
      };
    });
  }, [gpuType]);

  // Find approximate breakeven intersection coordinates for label
  const breakevenInfo = useMemo(() => {
    const CAPEX = 5000;
    const gpuHourlyCost = gpuType === 'T4' ? 0.35 : gpuType === 'A10G' ? 1.00 : 3.50;
    
    // Let's solve: vol * 9000 * 36 * 11.5 / 1M = CAPEX + 36 * (Math.ceil(vol/14400)*(gpuHourlyCost*730 + 80) + 500)
    // Continuous baseline approximation:
    const cloudCostPer3YSec = (9000 * 36 * 11.50) / 1000000; // ~$3.726 per hour of audio
    const localCostPer3YSec = (gpuHourlyCost * 730 + 80) * 36 / 14400; // fractional node speed
    const fixedLocal3YCost = CAPEX + (500 * 36); // ~$23k

    let breakevenHours = Math.round(fixedLocal3YCost / (cloudCostPer3YSec - localCostPer3YSec));
    if (breakevenHours < 200) breakevenHours = 350;
    if (breakevenHours > 20000) breakevenHours = 15000;

    const matchedCost = Math.round((breakevenHours * 9000 * 36 * 11.50) / 1000000);

    return {
      hours: breakevenHours,
      cost: matchedCost
    };
  }, [gpuType]);

  // Active cursor costs
  const activeCosts = useMemo(() => {
    const totalWordsOver3Years = (currentMonthlyHours * 9000 * 36) / 1000000;
    const cloud3Y = Math.round(totalWordsOver3Years * 11.50);
    const local3Y = Math.round(5000 + (clusterCostPerMonth * 36));
    const savings = Math.max(0, cloud3Y - local3Y);
    const isCloudCheaper = local3Y > cloud3Y;

    return {
      cloud: cloud3Y,
      local: local3Y,
      savings,
      isCloudCheaper
    };
  }, [currentMonthlyHours, clusterCostPerMonth]);

  const CustomTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div id="tco-tooltip" className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl font-sans text-xs space-y-1.5 pointer-events-none">
          <div className="font-bold border-b border-slate-800 pb-1 flex justify-between gap-4">
            <span>Volume: {data.volumeHours.toLocaleString()} Hrs/Mo</span>
            <span className="text-indigo-400 font-mono">{data.nodes} GPU Node{data.nodes > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Cloud TCO:</span>
            <span className="font-bold font-mono text-rose-400">${data["3-Year Cloud OpEx"].toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Local TCO:</span>
            <span className="font-bold font-mono text-emerald-400">${data["3-Year Local CapEx+OpEx"].toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="tco-chart-container" className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
            📈 3-Year Cumulative Total Cost of Ownership (TCO) Simulator
          </h4>
          <p className="text-xs text-slate-500">
            Comparing local cluster capital deployment fees (CapEx + maintenance) versus enterprise pay-per-use APIs over 36 months of scalability.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-lg p-1.5 px-2 text-[10px] text-slate-500 font-mono">
          <span>Simulation: 36 Mos</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="capitalize">{gpuType} Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cost stats and callouts */}
        <div className="lg:col-span-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
              <span className="text-[10px] font-mono text-rose-500 font-bold block uppercase tracking-wide">3-Year Cloud SaaS TCO</span>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                ${activeCosts.cloud.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                Pure operational expense billing under fluctuating monthly payload hours.
              </p>
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60">
              <span className="text-[10px] font-mono text-emerald-600 font-bold block uppercase tracking-wide">3-Year Local GPU TCO</span>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                ${activeCosts.local.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                Includes $5,000 setup CapEx and incremental nodes for scaling volume throughput.
              </p>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border-dashed border text-[11px] leading-relaxed font-sans ${
            activeCosts.isCloudCheaper 
              ? 'bg-slate-50 border-slate-205 text-slate-650'
              : 'bg-emerald-50 border-emerald-250 text-emerald-900'
          }`}>
            {activeCosts.isCloudCheaper ? (
              <div className="space-y-1">
                <span className="font-semibold text-slate-800">Cloud is cheaper at this scale</span>
                <p>At <b>{currentMonthlyHours.toLocaleString()} hours/mo</b>, cloud integrations prevent high upfront setup overhead amortization. Scaling beyond <b>{breakevenInfo.hours.toLocaleString()} hours</b> makes local setups highly lucrative.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
                  <span>🏆 Local Server Saves Up To:</span>
                  <span className="font-mono text-xs bg-emerald-100 px-1.5 py-0.2 rounded">${activeCosts.savings.toLocaleString()}</span>
                </div>
                <p className="text-[10px]">Your workload volume outperforms the cloud rate. Your amortization setup breaks even perfectly at <b>{breakevenInfo.hours.toLocaleString()} hours/mo</b>!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recharts chart */}
        <div id="tco-recharts-chart" className="lg:col-span-3 h-[255px] w-full pt-1 text-[10px] font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 30, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltipContent />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              <Line 
                name="3-Year Cloud OpEx ($11.50/M words)" 
                type="monotone" 
                dataKey="3-Year Cloud OpEx" 
                stroke="#f43f5e" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
              />
              
              <Line 
                name="3-Year Local CapEx+OpEx (Whisper Cluster)" 
                type="monotone" 
                dataKey="3-Year Local CapEx+OpEx" 
                stroke="#6366f1" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
              />

              {/* Mark current target hours context */}
              <ReferenceLine 
                x={`${(currentMonthlyHours / 1000).toFixed(1)}k hr`} 
                stroke="#8b5cf6" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ 
                  value: `You are here (${(currentMonthlyHours / 1000).toFixed(1)}k hr)`, 
                  fill: '#8b5cf6', 
                  position: 'insideBottomRight',
                  offset: 4,
                  fontSize: 10,
                  fontWeight: 'bold',
                  fontFamily: 'sans-serif'
                }} 
              />

              {/* Mark the theoretical breakeven point */}
              <ReferenceLine 
                x={`${(breakevenInfo.hours / 1000).toFixed(1)}k hr`} 
                stroke="#10b981" 
                strokeWidth={1.5} 
                strokeDasharray="3 3"
                label={{ 
                  value: `Breakeven Area (~${(breakevenInfo.hours / 1000).toFixed(1)}k hr)`, 
                  fill: '#10b981', 
                  position: 'top', 
                  fontSize: 9,
                  fontWeight: 'semibold'
                }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
