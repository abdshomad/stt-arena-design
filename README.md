# STT Arena: SOTA ASR Benchmarking & GPU Orchestration Platform

STT Arena is an advanced full-stack platform for benchmarking, optimizing, and orchestrating state-of-the-art Automatic Speech Recognition (ASR) / Speech-to-Text (STT) engines and CUDA-based graphics processing clusters. It features high-fidelity simulation controls as well as real live server integration capabilities for physical testing enviornments.

---

## 🚀 Architectural Blueprint

The platform employs a hybrid **React + Express** full-stack structure:
- **Frontend Panel**: Build in Vite with React, styled using tailwindcss utility definitions. It includes direct components for speech diarization visualizers, real-time waveform slicing controls, performance scatter plots, dialogue timing tables, and active GPU cluster graphs.
- **Express ASR/GPU Gateway**: A node-backend that serves as a proxy/virtual engine:
  - Generates highly authentic mock responses simulating real-world speech imperfections (Word Error rate, mumbling robustness, extreme temperature confidence metrics, custom vocabulary boosts).
  - Handles actual physical raw voice `.wav`/`.mp3` streams, parses diarization metadata, and returns speaker timelines.
  - Controls, synchronizes, and mocks GPU state pipelines, enabling active memory allocations (VRAM mapping), heat tracking, dynamic utility rates, and live model migrations.

---

## ⚙️ Configuration & Environment Variables

Inside the `.env` file (copied from `.env.example`), you can dynamically control the operation mode of the local gateway server:

```env
# Operational Mode: 'mockup' or 'live'. 
# - 'mockup': Uses high-fidelity simulated ASR metrics and state machines.
# - 'live': Proxies sound file uploads and parameters to the actual local ASR physical hardware.
ASR_MODE=mockup

# Real STT Physical IP/Port endpoint to forward audio requests when live
REAL_ASR_API_URL=http://localhost:5000/transcribe

# Real Host IP/Port endpoint to monitor/swap active cluster GPUs when live
REAL_GPU_API_URL=http://localhost:5000/gpus
```

---

## 📡 API Reference Specifications

### 1. Transcribe Audio (`POST /api/transcribe`)
Supports JSON objects or direct `multipart/form-data` audio file payloads.

#### Payload parameters:
- `modelId` (or `model` / `modelName`): Name or ID of the benchmarked candidate model (e.g., `faster-whisper`, `deepgram-nova-2`, `assembly-ai`).
- `text`: Anchor source script (used by simulator to generate WER errors).
- `language`: Target dialect (e.g. `English`, `Indonesian`).
- `isMumbled`: Boolean flag indicating Mumbler Audio stress-testing conditions.
- `temperature`: Float parameter control range `0.0` to `1.0` (higher simulates higher degradation rates).
- `vocabBoost`: Custom specialized glossary context arrays to reduce localized misspelling risks.

#### Success response schema (`200 OK`):
```json
{
  "text": "Corrected transcribed string outcome",
  "language": "Indonesian",
  "detectedEmotion": "Casual / Tech Slang (Excited)",
  "mode": "mockup",
  "latency_ms": 118,
  "model": "Faster Whisper Large",
  "segments": [
    {
      "start": 0.0,
      "end": 4.0,
      "text": "Corrected transcribed string",
      "speakerId": 0,
      "words": [
        {
          "word": "Corrected",
          "start": 0.0,
          "end": 0.3,
          "probability": 0.985
        }
      ]
    }
  ]
}
```

### 2. Get Global Cluster Registry (`GET /api/gpus`)
Retrieves live active hosts, VRAM capacity, health, temperature, wattage output, and active loaded weights mapping.

### 3. Load Model weights to CUDA (`POST /api/gpus/load`)
- Payload: ` { "modelId": "phi-3", "gpuId": "gpu-0" }`

### 4. Unload Model weights (`POST /api/gpus/unload`)
- Payload: `{ "modelId": "phi-3" }`

### 5. Relocate / Move Model weights (`POST /api/gpus/move`)
- Payload: `{ "modelId": "phi-3", "targetGpuId": "gpu-1" }`

---

## 🏃‍♂️ Startup & Growth Commands

### Prerequisites
Make sure you have Node dependencies installed:
```bash
npm install
```

### Development Server
Launches the custom full-stack Express server acting as the dev build proxy on Port 3000:
```bash
npm run dev
```

### Production Bundling & Build Compiles
Prepares production web files inside `dist/` and runs `esbuild` to compile `server.ts` into a standalone, compressed CommonJS deployment ready (`dist/server.cjs`):
```bash
npm run build
```

### Production Launch
Boot up the pre-compiled standalone executable on host `0.0.0.0` port 3000:
```bash
npm run start
```
