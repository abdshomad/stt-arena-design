import { GPUModel, ManagedModel } from '../types/gpu';

export const INITIAL_GPUS: GPUModel[] = [
  {
    id: "gpu-0",
    name: "NVIDIA H100 SXM5",
    vramTotalGb: 80,
    vramUsedGb: 0,
    utilization: 0,
    temperature: 42,
    powerUsageW: 110,
    powerLimitW: 700,
    loadedModelIds: []
  },
  {
    id: "gpu-1",
    name: "NVIDIA A100 PCIe",
    vramTotalGb: 40,
    vramUsedGb: 0,
    utilization: 0,
    temperature: 38,
    powerUsageW: 95,
    powerLimitW: 250,
    loadedModelIds: []
  },
  {
    id: "gpu-2",
    name: "NVIDIA RTX 4090",
    vramTotalGb: 24,
    vramUsedGb: 0,
    utilization: 0,
    temperature: 55,
    powerUsageW: 65,
    powerLimitW: 450,
    loadedModelIds: []
  },
  {
    id: "gpu-3",
    name: "NVIDIA T4",
    vramTotalGb: 16,
    vramUsedGb: 0,
    utilization: 0,
    temperature: 46,
    powerUsageW: 45,
    powerLimitW: 75,
    loadedModelIds: []
  }
];

export const INITIAL_MODELS: ManagedModel[] = [
  {
    id: "llama-3-8b",
    name: "Meta LLaMA 3.1 8B Instruct",
    sizeGb: 16.0,
    parameters: "8B",
    format: "FP16 / Unquantized",
    capabilities: ["Text Gen", "Coding", "Multilingual"],
    description: "Meta's highly versatile open text generation model. Excellent general intelligence and reasoning.",
    status: "unloaded"
  },
  {
    id: "whisper-large-v3",
    name: "OpenAI Whisper Large V3",
    sizeGb: 4.8,
    parameters: "1.5B ASR",
    format: "FP16",
    capabilities: ["ASR / STT", "Multilingual", "Translation"],
    description: "The gold standard open-source automatic speech-to-text and translation model.",
    status: "loaded",
    gpuId: "gpu-3"
  },
  {
    id: "llama-3-70b",
    name: "Meta LLaMA 3.1 70B (Q4_K_M)",
    sizeGb: 44.5,
    parameters: "70B",
    format: "GGUF Q4_K_M",
    capabilities: ["Text Gen", "Complex Reasoning", "Roleplay"],
    description: "Highly capable enterprise-grade instruction model, quantized to run efficiently on single/dual GPU nodes.",
    status: "unloaded"
  },
  {
    id: "qwen-2-72b",
    name: "Qwen 2.5 72B Instruct (Q5_K_M)",
    sizeGb: 51.2,
    parameters: "72B",
    format: "GGUF Q5_K_M",
    capabilities: ["Text Gen", "Coding", "Mathematics"],
    description: "State-of-the-art multilingual LLM with exceptional coding capability and Chinese support.",
    status: "loaded",
    gpuId: "gpu-0"
  },
  {
    id: "gemma-2-9b",
    name: "Google Gemma 2 9B Instruct",
    sizeGb: 18.2,
    parameters: "9B",
    format: "BF16",
    capabilities: ["Text Gen", "Math", "Summarization"],
    description: "Google's lightweight, high-performance open model. Outperforms many larger open models on academic benchmarks.",
    status: "loaded",
    gpuId: "gpu-1"
  },
  {
    id: "mistral-nemo-12b",
    name: "Mistral NeMo 12B Instruct",
    sizeGb: 24.0,
    parameters: "12B",
    format: "FP16",
    capabilities: ["Text Gen", "Multilingual", "128k Context"],
    description: "Mistral & NVIDIA joint venture. Exceptional multi-turn conversation and massive context window support.",
    status: "unloaded"
  },
  {
    id: "phi-3-medium",
    name: "Microsoft Phi-3 Medium",
    sizeGb: 14.0,
    parameters: "14B",
    format: "FP16",
    capabilities: ["Text Gen", "Logic", "Reasoning"],
    description: "Highly optimized small model trained on high-quality synthetic datasets. Exceptional logical capabilities.",
    status: "unloaded"
  }
];
