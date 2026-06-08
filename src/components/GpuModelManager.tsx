import React, { useState, useEffect, useMemo } from 'react';
import { GPUModel, ManagedModel, GpuLogMsg } from '../types/gpu';
import { INITIAL_GPUS, INITIAL_MODELS } from '../data/gpuData';
import { GpuCard } from './GpuCard';
import { ModelCard } from './ModelCard';
import { GpuStatsGrid } from './GpuStatsGrid';
import { GpuOrchestratorTerminal } from './GpuOrchestratorTerminal';
import { SlidersHorizontal, AlertTriangle } from 'lucide-react';

export const GpuModelManager: React.FC = () => {
  // Local fallback bootstrapping
  const prepareGpuStates = () => {
    return INITIAL_GPUS.map((gpu) => {
      const loadedModelsOnThisGpu = INITIAL_MODELS.filter((m) => m.gpuId === gpu.id);
      const usedVram = loadedModelsOnThisGpu.reduce((acc, current) => acc + current.sizeGb, 0);
      const maxModels = loadedModelsOnThisGpu.length;
      return {
        ...gpu,
        vramUsedGb: usedVram,
        utilization: maxModels > 0 ? Math.min(95, Math.round(loadedModelsOnThisGpu.reduce((acc, m) => acc + (m.sizeGb * 1.2), 0))) : 0,
        temperature: maxModels > 0 ? Math.min(80, 40 + maxModels * 12) : 38 + Math.round(Math.random() * 4),
        powerUsageW: maxModels > 0 ? Math.min(gpu.powerLimitW - 20, 80 + Math.round(usedVram * 5)) : 40 + Math.round(Math.random() * 5),
        loadedModelIds: loadedModelsOnThisGpu.map((m) => m.id),
      };
    });
  };

  const [gpus, setGpus] = useState<GPUModel[]>(prepareGpuStates);
  const [models, setModels] = useState<ManagedModel[]>(INITIAL_MODELS);
  const [logs, setLogs] = useState<GpuLogMsg[]>([
    { id: '1', timestamp: '15:40:35', level: 'success', message: 'HPC GPU Orchestration engine initialized.' },
    { id: '2', timestamp: '15:40:36', level: 'info', message: 'Ready to connect ASR Node Gateway.' }
  ]);
  const [filterCapState, setFilterCapState] = useState<string>('All');
  const [vramWarning, setVramWarning] = useState<string | null>(null);

  const addLog = (message: string, level: 'info' | 'warning' | 'success' = 'info') => {
    const rTime = new Date().toTimeString().split(' ')[0];
    const newLog: GpuLogMsg = {
      id: Math.random().toString(),
      timestamp: rTime,
      level,
      message
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  // Sync state from server on mount & trigger heartbeat polling
  const syncClusterState = () => {
    fetch('/api/gpus')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gpus && data.models) {
          setGpus(data.gpus);
          setModels(data.models);
          if (data.fallbackWarning) {
            setVramWarning(data.fallbackWarning);
          }
        }
      })
      .catch((err) => {
        console.warn("Express GPU server connection offline. Running in browser-sandbox mode: ", err.message);
      });
  };

  useEffect(() => {
    syncClusterState();
    const interval = setInterval(syncClusterState, 5000);
    return () => clearInterval(interval);
  }, []);

  // LOAD MODEL HANDLER
  const handleLoadModel = (modelId: string, gpuId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    const targetGpu = gpus.find((g) => g.id === gpuId);
    if (!targetModel || !targetGpu) return;

    const freeSpace = targetGpu.vramTotalGb - targetGpu.vramUsedGb;
    if (freeSpace < targetModel.sizeGb) {
      setVramWarning(`VRAM allocation failed on ${targetGpu.name}. Required: ${targetModel.sizeGb} GB, Available: ${freeSpace.toFixed(1)} GB.`);
      addLog(`Failed to load ${targetModel.name} on ${targetGpu.name}: Insufficient VRAM.`, 'warning');
      return;
    }

    setVramWarning(null);
    addLog(`Initiating loading pipeline for ${targetModel.name} onto ${targetGpu.name}...`, 'info');

    // Optimitistic UI Load transition
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'loading', gpuId, progress: 30 } : m))
    );

    fetch('/api/gpus/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, gpuId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gpus && data.models) {
          setGpus(data.gpus);
          setModels(data.models);
          if (data.fallbackWarning) setVramWarning(data.fallbackWarning);
        }
        addLog(`Model ${targetModel.name} loaded successfully onto ${targetGpu.name}.`, 'success');
      })
      .catch(() => {
        // Safe UI Fallback on connection error
        setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, status: 'loaded', progress: 100 } : m)));
        setGpus((curr) =>
          curr.map((g) => {
            if (g.id !== gpuId) return g;
            const newUsed = g.vramUsedGb + targetModel.sizeGb;
            return {
              ...g,
              vramUsedGb: parseFloat(newUsed.toFixed(1)),
              utilization: Math.round(Math.min(95, 30 + (newUsed / g.vramTotalGb) * 50)),
              temperature: Math.round(Math.min(80, g.temperature + 12)),
              powerUsageW: Math.round(Math.min(g.powerLimitW - 10, g.powerUsageW + 120)),
              loadedModelIds: [...g.loadedModelIds, modelId]
            };
          })
        );
        addLog(`Model ${targetModel.name} loaded successfully onto ${targetGpu.name} (local fallback).`, 'success');
      });
  };

  // UNLOAD MODEL HANDLER
  const handleUnloadModel = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    if (!targetModel || !targetModel.gpuId) return;

    setVramWarning(null);
    addLog(`De-allocating VRAM pool. Unloading ${targetModel.name}...`, 'info');

    fetch('/api/gpus/unload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gpus && data.models) {
          setGpus(data.gpus);
          setModels(data.models);
          if (data.fallbackWarning) setVramWarning(data.fallbackWarning);
        }
        addLog(`Model ${targetModel.name} unloaded and resource registers freed.`, 'success');
      })
      .catch(() => {
        // Safe UI Fallback
        setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, status: 'unloaded', gpuId: undefined, progress: undefined } : m)));
        setGpus((curr) =>
          curr.map((g) => {
            if (g.id !== targetModel.gpuId) return g;
            const remaining = g.loadedModelIds.filter((id) => id !== modelId);
            const newUsed = Math.max(0, g.vramUsedGb - targetModel.sizeGb);
            const active = remaining.length > 0;
            return {
              ...g,
              vramUsedGb: parseFloat(newUsed.toFixed(1)),
              utilization: active ? Math.round((newUsed / g.vramTotalGb) * 45 + 15) : 0,
              temperature: active ? Math.max(45, g.temperature - 10) : 38 + Math.round(Math.random() * 3),
              powerUsageW: active ? Math.max(80, g.powerUsageW - 100) : 40 + Math.round(Math.random() * 4),
              loadedModelIds: remaining
            };
          })
        );
        addLog(`Model ${targetModel.name} unloaded internally (local fallback).`, 'success');
      });
  };

  // LIVE TRANSFER/MOVE MODEL HANDLER
  const handleMoveModel = (modelId: string, targetGpuId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    const targetGpu = gpus.find((g) => g.id === targetGpuId);
    const originGpuId = targetModel?.gpuId;
    if (!targetModel || !targetGpu || !originGpuId) return;

    if (targetGpu.vramTotalGb - targetGpu.vramUsedGb < targetModel.sizeGb) {
      setVramWarning(`Transfer failed. Target Node ${targetGpu.name} has insufficient free VRAM.`);
      return;
    }

    setVramWarning(null);
    addLog(`Live relocating ${targetModel.name} to target host ${targetGpu.name}...`, 'info');

    fetch('/api/gpus/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, targetGpuId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gpus && data.models) {
          setGpus(data.gpus);
          setModels(data.models);
          if (data.fallbackWarning) setVramWarning(data.fallbackWarning);
        }
        addLog(`Rescheduled ${targetModel.name} successfully onto ${targetGpu.name}.`, 'success');
      })
      .catch(() => {
        // Safe UI Fallback
        setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, gpuId: targetGpuId } : m)));
        addLog(`Relocated ${targetModel.name} internally to target node (local fallback).`, 'success');
      });
  };

  const stats = useMemo(() => {
    const totalGpus = gpus.length;
    const activeModelsCount = models.filter((m) => m.status === 'loaded').length;
    const sumUsedVram = gpus.reduce((acc, g) => acc + g.vramUsedGb, 0);
    const sumTotalVram = gpus.reduce((acc, g) => acc + g.vramTotalGb, 0);
    return {
      activeModelsCount,
      sumUsedVram: parseFloat(sumUsedVram.toFixed(1)),
      sumTotalVram,
      totalVramAllocPercent: sumTotalVram > 0 ? Math.round((sumUsedVram / sumTotalVram) * 100) : 0,
      avgUtil: totalGpus > 0 ? Math.round(gpus.reduce((acc, g) => acc + g.utilization, 0) / totalGpus) : 0,
      totalPower: gpus.reduce((acc, g) => acc + g.powerUsageW, 0)
    };
  }, [gpus, models]);

  const filteredModels = useMemo(() => {
    if (filterCapState === 'All') return models;
    return models.filter((m) => m.capabilities.includes(filterCapState));
  }, [models, filterCapState]);

  return (
    <div className="space-y-6">
      {vramWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs text-amber-800 animate-fade">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-semibold">{vramWarning}</span>
          </div>
          <button onClick={() => setVramWarning(null)} className="text-amber-600 hover:text-amber-900 font-bold px-2 py-1 font-mono cursor-pointer">
            DISMISS
          </button>
        </div>
      )}

      <GpuStatsGrid stats={stats} totalStandbyModels={models.length - stats.activeModelsCount} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {gpus.map((gpu) => (
            <GpuCard
              key={gpu.id}
              gpu={gpu}
              loadedModels={models.filter((m) => m.gpuId === gpu.id && m.status === 'loaded')}
              allGpus={gpus}
              onUnloadModel={handleUnloadModel}
              onMoveModel={handleMoveModel}
            />
          ))}
        </div>
        <GpuOrchestratorTerminal logs={logs} onClear={() => setLogs([])} />
      </div>

      <div className="pt-4 border-t border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">Model Card Registry Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available open-weight models in your registry. Tap loaded cards to move nodes or unload them from active CUDA slots.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Capabilities:
            </span>
            <select
              value={filterCapState}
              onChange={(e) => setFilterCapState(e.target.value)}
              className="py-1 px-2.5 rounded-lg border-0 bg-white shadow-xs text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Text Gen">Text Generation</option>
              <option value="Coding">Code Generation</option>
              <option value="ASR / STT">ASR / Speech Recognition</option>
              <option value="Multilingual">Multilingual Capabilities</option>
              <option value="Complex Reasoning">Complex Reasoning</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-5">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              gpus={gpus}
              onLoadModel={handleLoadModel}
              onUnloadModel={handleUnloadModel}
              onMoveModel={handleMoveModel}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
