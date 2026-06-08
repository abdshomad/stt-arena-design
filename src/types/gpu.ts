export interface GPUModel {
  id: string;
  name: string;
  vramTotalGb: number;
  vramUsedGb: number;
  utilization: number; // 0 - 100%
  temperature: number; // °C
  powerUsageW: number; // current power draw in watts
  powerLimitW: number; // max power in watts
  loadedModelIds: string[];
}

export interface ManagedModel {
  id: string;
  name: string;
  sizeGb: number; // RAM footprint in GB
  parameters: string; // e.g. "8B", "70B", "1.5B"
  format: string; // e.g. "GGUF Q4_K_M", "FP16", "INT8"
  capabilities: string[]; // e.g. ["ASR", "Text Gen", "Coding", "Vision"]
  description: string;
  status: 'unloaded' | 'loading' | 'loaded';
  gpuId?: string; // which GPU it's currently loaded on, if any
  progress?: number; // load progress percentage (if 'loading')
}

export interface GpuLogMsg {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'success';
  message: string;
}
