import React, { useState, useEffect, useMemo } from 'react';
import { GPUModel, ManagedModel, GpuLogMsg } from '../types/gpu';
import { INITIAL_GPUS, INITIAL_MODELS } from '../data/gpuData';
import { CANDIDATE_MODELS } from '../data/modelsData';
import { GpuCard } from './GpuCard';
import { ModelCard } from './ModelCard';
import { GpuStatsGrid } from './GpuStatsGrid';
import { GpuOrchestratorTerminal } from './GpuOrchestratorTerminal';
import { SlidersHorizontal, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  'Whisper Models',
  'NVIDIA Models',
  'Meta Models',
  'Google Models',
  'Microsoft Models',
  'Browser-Based Engines',
  'Other Models'
];

const getModelCategory = (model: ManagedModel): string => {
  const nameLower = model.name.toLowerCase();
  const idLower = model.id.toLowerCase();
  
  if (idLower.startsWith('browser-') || model.sourceType?.includes('Browser')) {
    return 'Browser-Based Engines';
  }
  if (nameLower.includes('whisper')) {
    return 'Whisper Models';
  }
  if (nameLower.includes('nvidia') || nameLower.includes('nemotron')) {
    return 'NVIDIA Models';
  }
  if (nameLower.includes('llama') || nameLower.includes('meta')) {
    return 'Meta Models';
  }
  if (nameLower.includes('gemma') || nameLower.includes('google')) {
    return 'Google Models';
  }
  if (nameLower.includes('phi') || nameLower.includes('microsoft')) {
    return 'Microsoft Models';
  }
  return 'Other Models';
};

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

  const browserManagedModels: ManagedModel[] = useMemo(() => {
    return CANDIDATE_MODELS.filter((m) => m.id.startsWith('browser-')).map((m) => ({
      id: m.id,
      name: m.name,
      sizeGb: (m.downloadSizeMb || 0) / 1025,
      parameters: "STT",
      format: m.sourceType === "Browser / Native" ? "Native API" : "WASM / GGML",
      capabilities: ["ASR / STT"].concat(m.multilingual ? ["Multilingual"] : []),
      description: `In-browser client-side runner utilizing ${m.sourceType}. ${m.multilingual ? "Supports multilingual speech-to-text natively." : "Supports English transcription."}`,
      status: m.id === "browser-web-speech-api" ? "loaded" : "unloaded",
      downloadSizeMb: m.downloadSizeMb,
      sourceType: m.sourceType
    }));
  }, []);

  const [gpus, setGpus] = useState<GPUModel[]>(prepareGpuStates);
  const [models, setModels] = useState<ManagedModel[]>(() => {
    const list = [...INITIAL_MODELS];
    
    let savedStatuses: { [id: string]: string } = {};
    const stored = localStorage.getItem('stt_browser_model_statuses');
    if (stored) {
      try {
        savedStatuses = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored browserStatuses in model manager initializer:", e);
      }
    }

    // Map initial browser models into ManagedModel
    const browserList = CANDIDATE_MODELS.filter((m) => m.id.startsWith('browser-')).map((m) => {
      const savedStatus = savedStatuses[m.id];
      return {
        id: m.id,
        name: m.name,
        sizeGb: (m.downloadSizeMb || 0) / 1025,
        parameters: "STT",
        format: m.sourceType === "Browser / Native" ? "Native API" : "WASM / GGML",
        capabilities: ["ASR / STT"].concat(m.multilingual ? ["Multilingual"] : []),
        description: `In-browser client-side runner utilizing ${m.sourceType}. ${m.multilingual ? "Supports multilingual speech-to-text natively." : "Supports English transcription."}`,
        status: (savedStatus || (m.id === "browser-web-speech-api" ? "loaded" : "unloaded")) as any,
        downloadSizeMb: m.downloadSizeMb,
        sourceType: m.sourceType
      };
    });
    browserList.forEach(bm => {
      if (!list.some(x => x.id === bm.id)) {
        list.push(bm);
      }
    });
    return list;
  });

  // Keep localStorage in sync with our browser models' loaded status
  useEffect(() => {
    const browserStatuses: { [id: string]: string } = {};
    models.forEach(m => {
      if (m.id.startsWith('browser-')) {
        browserStatuses[m.id] = m.status;
      }
    });
    localStorage.setItem('stt_browser_model_statuses', JSON.stringify(browserStatuses));
    
    // Broadcast custom event for other listeners in App.tsx
    const event = new CustomEvent('stt-models-updated', { detail: models });
    window.dispatchEvent(event);
  }, [models]);
  const [logs, setLogs] = useState<GpuLogMsg[]>([
    { id: '1', timestamp: '15:40:35', level: 'success', message: 'HPC GPU Orchestration engine initialized.' },
    { id: '2', timestamp: '15:40:36', level: 'info', message: 'Ready to connect ASR Node Gateway.' }
  ]);
  const [filterCapState, setFilterCapState] = useState<string>('All');
  const [filterSourceType, setFilterSourceType] = useState<string>('All');
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
          setModels((prevModels) => {
            const fetchedModels: ManagedModel[] = data.models;
            
            // Re-bootstrap local browser status map
            const localStateMap = new Map<string, { status: 'unloaded' | 'loading' | 'loaded', progress?: number }>();
            prevModels.forEach(m => {
              if (m.id.startsWith('browser-')) {
                localStateMap.set(m.id, { status: m.status, progress: m.progress });
              }
            });

            const activeBrowserModels = browserManagedModels.map(bm => {
              const saved = localStateMap.get(bm.id);
              return {
                ...bm,
                status: saved?.status ?? bm.status,
                progress: saved?.progress ?? bm.progress
              };
            });

            // Prevent duplicate models in UI catalog
            const merged = [...fetchedModels];
            activeBrowserModels.forEach(bm => {
              if (!merged.some(m => m.id === bm.id)) {
                merged.push(bm);
              }
            });
            return merged;
          });

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
    if (!targetModel) return;

    if (modelId.startsWith('browser-') || gpuId === 'browser') {
      setVramWarning(null);
      addLog(`Initiating browser-side downloads for ${targetModel.name}...`, 'info');
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: 'loading', progress: 5 } : m))
      );
      
      let curProgress = 5;
      const interval = setInterval(() => {
        curProgress += Math.round(Math.random() * 15) + 5;
        if (curProgress >= 100) {
          curProgress = 100;
          clearInterval(interval);
          setModels((prev) =>
            prev.map((m) => (m.id === modelId ? { ...m, status: 'loaded', progress: undefined } : m))
          );
          addLog(`${targetModel.name} successfully compiled & loaded in browser context!`, 'success');
        } else {
          setModels((prev) =>
            prev.map((m) => (m.id === modelId ? { ...m, progress: curProgress } : m))
          );
        }
      }, 200);
      return;
    }

    const targetGpu = gpus.find((g) => g.id === gpuId);
    if (!targetGpu) return;

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
    if (!targetModel) return;

    if (modelId.startsWith('browser-')) {
      setVramWarning(null);
      addLog(`Disposing browser variables & freeing client-side RAM for ${targetModel.name}.`, 'info');
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: 'unloaded', progress: undefined } : m))
      );
      addLog(`${targetModel.name} unloaded from browser storage.`, 'success');
      return;
    }

    if (!targetModel.gpuId) return;

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

  const handleLoadGroup = (groupName: string, groupModels: ManagedModel[]) => {
    addLog(`Initiating bulk load for group: ${groupName}...`, 'info');
    groupModels.forEach((m) => {
      if (m.status !== 'unloaded') return;
      if (m.id.startsWith('browser-') || m.sourceType?.startsWith('Browser')) {
        handleLoadModel(m.id, 'browser');
      } else {
        const targetGpu = gpus.find((g) => g.vramTotalGb - g.vramUsedGb >= m.sizeGb);
        if (targetGpu) {
          handleLoadModel(m.id, targetGpu.id);
        } else {
          addLog(`Bulk load failed for ${m.name}: Insufficient VRAM on cluster.`, 'warning');
        }
      }
    });
  };

  const handleUnloadGroup = (groupName: string, groupModels: ManagedModel[]) => {
    addLog(`Initiating bulk unload for group: ${groupName}...`, 'info');
    groupModels.forEach((m) => {
      if (m.status === 'unloaded') return;
      handleUnloadModel(m.id);
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
    return models.filter((m) => {
      const capMatch = filterCapState === 'All' || m.capabilities.includes(filterCapState);
      const isBrowser = m.id.startsWith('browser-') || m.sourceType?.includes('Browser');
      const sourceMatch = filterSourceType === 'All'
        ? true
        : filterSourceType === 'Browser'
        ? isBrowser
        : !isBrowser;
      return capMatch && sourceMatch;
    });
  }, [models, filterCapState, filterSourceType]);

  const groupedModels = useMemo(() => {
    const groups: { [key: string]: ManagedModel[] } = {};
    for (const cat of CATEGORIES) {
      groups[cat] = [];
    }
    
    for (const model of filteredModels) {
      const cat = getModelCategory(model);
      groups[cat].push(model);
    }
    
    return groups;
  }, [filteredModels]);

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

          <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters:
            </span>
            <select
              value={filterCapState}
              onChange={(e) => setFilterCapState(e.target.value)}
              className="py-1 px-2.5 rounded-lg border-0 bg-white shadow-xs text-xs font-semibold focus:outline-none cursor-pointer text-slate-800"
            >
              <option value="All">All Capabilities</option>
              <option value="Text Gen">Text Generation</option>
              <option value="Coding">Code Generation</option>
              <option value="ASR / STT">ASR / Speech Recognition</option>
              <option value="Multilingual">Multilingual Capabilities</option>
              <option value="Complex Reasoning">Complex Reasoning</option>
            </select>
            <span className="h-4 w-px bg-slate-300 mx-1"></span>
            <select
              value={filterSourceType}
              onChange={(e) => setFilterSourceType(e.target.value)}
              className="py-1 px-2.5 rounded-lg border-0 bg-white shadow-xs text-xs font-semibold focus:outline-none cursor-pointer text-slate-800"
            >
              <option value="All">All Sources</option>
              <option value="Browser">Browser / WASM / Native</option>
              <option value="Cloud">Node / GPU Cloud</option>
            </select>
          </div>
        </div>

        <div className="space-y-10 mt-6">
          {CATEGORIES.map((category) => {
            const list = groupedModels[category] || [];
            if (list.length === 0) return null;
            return (
              <div key={category} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
                  <div>
                    <h3 className="text-slate-905 font-display font-bold text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                      {category}
                      <span className="text-[11px] font-mono text-slate-400 font-normal ml-1">({list.length} models)</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadGroup(category, list)}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Load All Engines
                    </button>
                    <button
                      onClick={() => handleUnloadGroup(category, list)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Unload All Engines
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {list.map((model) => (
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
            );
          })}
        </div>
      </div>
    </div>
  );
};
