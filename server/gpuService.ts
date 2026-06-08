import axios from "axios";
import { GPUModel, ManagedModel } from "../src/types/gpu";
import { INITIAL_GPUS, INITIAL_MODELS } from "../src/data/gpuData.js";

// Keep in-memory state for mock mode so load/unload/move persist dynamically!
let mockGpus: GPUModel[] = [];
let mockModels: ManagedModel[] = [];

export function initializeGpus() {
  mockModels = JSON.parse(JSON.stringify(INITIAL_MODELS));
  mockGpus = INITIAL_GPUS.map((gpu) => {
    const loadedModelsOnThisGpu = mockModels.filter((m) => m.gpuId === gpu.id);
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
}

// Perform initial setup
initializeGpus();

export function getMockGpuState() {
  // Let active metrics fluctuate naturally on each heartbeat fetch
  const fluctuatedGpus = mockGpus.map((gpu) => {
    if (gpu.utilization === 0) return gpu;
    return {
      ...gpu,
      utilization: Math.max(5, Math.min(100, gpu.utilization + (Math.random() > 0.5 ? 2 : -2))),
      temperature: Math.max(35, Math.min(85, gpu.temperature + (Math.random() > 0.5 ? 1 : -1))),
      powerUsageW: Math.max(50, Math.min(gpu.powerLimitW, gpu.powerUsageW + (Math.random() > 0.5 ? 3 : -3)))
    };
  });

  return {
    gpus: fluctuatedGpus,
    models: mockModels,
    mode: "mockup"
  };
}

export function loadMockModel(modelId: string, gpuId: string) {
  const model = mockModels.find(m => m.id === modelId);
  const gpu = mockGpus.find(g => g.id === gpuId);
  if (!model || !gpu) return false;

  // Update Model status
  model.status = "loaded";
  model.gpuId = gpuId;
  model.progress = 100;

  // Update GPU allocations
  if (!gpu.loadedModelIds.includes(modelId)) {
    gpu.loadedModelIds.push(modelId);
  }

  // Recalculate metrics
  const chargedModels = mockModels.filter(m => m.gpuId === gpu.id && m.status === "loaded");
  const usedVram = chargedModels.reduce((acc, m) => acc + m.sizeGb, 0);
  gpu.vramUsedGb = parseFloat(usedVram.toFixed(1));
  gpu.utilization = Math.round(Math.min(95, 30 + (usedVram / gpu.vramTotalGb) * 50));
  gpu.temperature = Math.round(Math.min(80, gpu.temperature + 12));
  gpu.powerUsageW = Math.round(Math.min(gpu.powerLimitW - 10, gpu.powerUsageW + 120));

  return true;
}

export function unloadMockModel(modelId: string) {
  const model = mockModels.find(m => m.id === modelId);
  if (!model || !model.gpuId) return false;

  const gpuId = model.gpuId;
  const gpu = mockGpus.find(g => g.id === gpuId);

  // Mark Model unloaded
  model.status = "unloaded";
  model.gpuId = undefined;
  model.progress = undefined;

  // Unlink from GPU
  if (gpu) {
    gpu.loadedModelIds = gpu.loadedModelIds.filter(id => id !== modelId);
    
    // Recalculate metrics
    const remainingModels = mockModels.filter(m => m.gpuId === gpu.id && m.status === "loaded");
    const usedVram = remainingModels.reduce((acc, m) => acc + m.sizeGb, 0);
    gpu.vramUsedGb = parseFloat(usedVram.toFixed(1));
    const active = gpu.loadedModelIds.length > 0;
    gpu.utilization = active ? Math.round((usedVram / gpu.vramTotalGb) * 45 + 15) : 0;
    gpu.temperature = active ? Math.max(45, gpu.temperature - 10) : 38 + Math.round(Math.random() * 3);
    gpu.powerUsageW = active ? Math.max(80, gpu.powerUsageW - 100) : 40 + Math.round(Math.random() * 4);
  }

  return true;
}

export function moveMockModel(modelId: string, targetGpuId: string) {
  const model = mockModels.find(m => m.id === modelId);
  if (!model || !model.gpuId) return false;

  const originGpuId = model.gpuId;
  const originGpu = mockGpus.find(g => g.id === originGpuId);
  const targetGpu = mockGpus.find(g => g.id === targetGpuId);

  if (!targetGpu) return false;

  // Re-route Model
  model.gpuId = targetGpuId;
  model.status = "loaded";

  // Rebuild origin metrics
  if (originGpu) {
    originGpu.loadedModelIds = originGpu.loadedModelIds.filter(id => id !== modelId);
    const originLoaded = mockModels.filter(m => m.gpuId === originGpuId && m.status === "loaded");
    const originUsed = originLoaded.reduce((acc, m) => acc + m.sizeGb, 0);
    originGpu.vramUsedGb = parseFloat(originUsed.toFixed(1));
    const originActive = originGpu.loadedModelIds.length > 0;
    originGpu.utilization = originActive ? Math.round((originUsed / originGpu.vramTotalGb) * 40 + 15) : 0;
    originGpu.temperature = originActive ? Math.max(45, originGpu.temperature - 10) : 38 + Math.round(Math.random() * 2);
    originGpu.powerUsageW = originActive ? Math.max(80, originGpu.powerUsageW - 100) : 40 + Math.round(Math.random() * 3);
  }

  // Rebuild target metrics
  if (!targetGpu.loadedModelIds.includes(modelId)) {
    targetGpu.loadedModelIds.push(modelId);
  }
  const targetLoaded = mockModels.filter(m => m.gpuId === targetGpuId && m.status === "loaded");
  const targetUsed = targetLoaded.reduce((acc, m) => acc + m.sizeGb, 0);
  targetGpu.vramUsedGb = parseFloat(targetUsed.toFixed(1));
  targetGpu.utilization = Math.round(Math.min(95, 30 + (targetUsed / targetGpu.vramTotalGb) * 45));
  targetGpu.temperature = Math.round(Math.min(80, targetGpu.temperature + 8));
  targetGpu.powerUsageW = Math.round(Math.min(targetGpu.powerLimitW - 10, targetGpu.powerUsageW + 110));

  return true;
}

// Proxies to a physical local live server
export async function fetchLiveGpuState(apiUrl: string) {
  const response = await axios.get(apiUrl, { timeout: 10000 });
  return {
    gpus: response.data.gpus || [],
    models: response.data.models || [],
    mode: "live"
  };
}

export async function postLiveGpuAction(apiUrl: string, action: "load" | "unload" | "move", body: any) {
  const response = await axios.post(`${apiUrl}/${action}`, body, { timeout: 10000 });
  return {
    gpus: response.data.gpus || [],
    models: response.data.models || [],
    mode: "live"
  };
}
