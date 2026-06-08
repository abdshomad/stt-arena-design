# STT Arena Enhancement Plan

This document details the active enhancement roadmap for STT Arena—the state-of-the-art automatic speech recognition (ASR) benchmarking and orchestration engine.

---

## 1. Interactive Leaderboard & Weighting Dynamic Algorithm

- **1.1: Automatic Dataset-Specific Weight Profiler Selectors**
  - **Description**: Introduce pre-configured weighting presets tailored to specific dataset scenarios (such as Call Center Analytics, Medical Dictations, Bilingual Interviews, and Indonesian Dialect/Slang heavy sessions). Clicking a preset profile will automatically recalibrate the core scoring weights (Accuracy, Latency, Indonesian Support, and Resource Economy) to reflect industry priorities, showing dynamic visual transitions on the weight sliders and re-sorting the active rankings.
  - **Status**: `[DONE]`

- **1.2: Heatmap 2D Scatter/Bubble Correlation Chart**
  - **Description**: Add an interactive Recharts 2D Scatter/Bubble Plot directly beneath the filters on the Leaderboard tab. This visualization will graph each loaded engine's Word Error Rate (WER) against its Processing Latency, with bubble sizes corresponding to the model's VRAM requirements, providing an elegant visual matrix to correlate accuracy, latency, and hardware cost.
  - **Status**: `[DONE]`

- **1.3: Comparative Scoring Simulation Matrix Sandbox**
  - **Description**: Implement a "Metric Sensitivity Probe" sub-panel under the leaderboard table. This sandbox allows users to simulate varying degrees of network packet loss, audio sample degradation, or heavy background noise, and see in real-time how the custom scores and ranks of local versus cloud models fluctuate.
  - **Status**: `[TODO]`

---

## 2. Dynamic Comparative Arena Simulator

- **2.1: Custom Audio URL / Wave File Uploader & Parser**
  - **Description**: Integrate an interactive file drag-and-drop uploader and URL paste input field. This allows developers to supply their own WAV/MP3 files up to 10MB or paste an audio URL, dynamically computing the waveform envelope, simulating word-level predictions, and displaying them side-by-side with adjustable playback speeds (0.5x, 1x, 2x).
  - **Status**: `[DONE]`

- **2.2: Dual-Speaker Dialogue Conversation Builder**
  - **Description**: Introduce a conversational turn-by-turn editor component inside the Dialogue Arena. It exposes an editable table where developers can build custom dialogue segments (custom timing intervals, text prompts, speaker assignments) to test custom diarization alignments and speaker overlapping scenarios.
  - **Status**: `[DONE]`

- **2.3: Multilingual Code-Switching Token Highlight Tool**
  - **Description**: Integrate an interactive "Language Code-Switch Analyzer" overlay for transcripts with mixed languages (e.g., Indonesian / English slang). This tool highlights English vs. Indonesian words in dedicated high-contrast colored pills, allowing users to hover over any token to inspect structural confidence indicators and language categorization tags of the engines.
  - **Status**: `[TODO]`

---

## 3. High-Fidelity Cost Calculator (Cloud vs. Local GPU Clusters)

- **3.1: ROI Breakeven Trend Chart with Scalable Audio Volume**
  - **Description**: Integrate an interactive dual-axis line chart in the cost calculator illustrating the cumulative 3-year Total Cost of Ownership (TCO) comparing active GPU cluster options to Cloud SaaS alternatives. As transcribing volume (hours/month) increases via a responsive slider, the chart dynamically marks and highlights the exact breakeven intersection of CAPEX vs. OPEX.
  - **Status**: `[DONE]`

- **3.2: Multi-Cloud Hardware Infrastructure Pricer & Customized Nodes**
  - **Description**: Create an advanced cloud hardware customizer drawer that lets users toggle between tier-1 clouds (AWS, GCP, Azure, RunPod, Lambda Labs) to choose specific GPU models (e.g., H100, A100 80GB, L4, T4). This overrides default node pricing, automatically updating overhead cost elements like ingress/egress network fees, and DevOps staffing costs.
  - **Status**: `[TODO]`

- **3.3: Compression Bitrate and SLA Audio Processing Formula**
  - **Description**: Implement an interactive drop-down configuration panel to select audio container formats (RAW WAV, FLAC, high-quality MP3, ultra-low bitrate OPUS) with real-time calculations showing estimated network bandwidth bytes stored monthly. The tool automatically integrates these storage fees and egress network overhead costs into the monthly cluster bill projections.
  - **Status**: `[TODO]`

---

## 4. Production Integration Deployment Blueprints (SDK Center)

- **4.1: Live API Payload Snippet Generator with Client Configurator**
  - **Description**: Provide real-time editable parameter inputs on the deployment panel (such as live authentication tokens, custom terminology vocabulary, temperature, and maximum chunk token sizes). Updating any of these fields immediately propagates changes directly inside clean Python, Node.js, and Golang backend snippets, offering a "Copy Payload" container shortcut.
  - **Status**: `[DONE]`

- **4.2: Comprehensive Production-Grade Docker Compose Orchestration Setup**
  - **Description**: Provide a complete, production-ready `docker-compose.yml` config block containing ready-to-run configurations for Triton Inference Server, Redis Queue, Celery worker nodes, and an Nginx reverse-proxy setup. The code dynamically references the selected Whisper or local engine, incorporating correct CUDA requirements and volume definitions.
  - **Status**: `[TODO]`

- **4.3: WebSocket Latency Simulator and Real-Time Event Handlers**
  - **Description**: Add an interactive client-side browser emulator within the SDK tab that simulates receiving binary PCM/WebSocket audio chunks. It renders responsive mock live event listeners for opening connections, transmitting frame-level headers, receiving word-level confidence feedback, and terminating stream handshakes.
  - **Status**: `[TODO]`

---

## 5. Live HPC GPU Cluster & Model Orchestration Dashboard

- **5.1: Fault Injection & CUDA State Chaos Manager**
  - **Description**: Implement a "GPU Cluster Anomaly & Fault Injection" panel on the GPU list. Users can trigger custom simulated incidents on selected active GPU nodes (such as simulated CUDA Out of Memory exceptions, extreme thermal throttling warnings >88°C, or fan speed failures). This raises dramatic, flashing status alerts, real-time log outputs, and guides the user through hot-swapping workloads to pristine healthy nodes.
  - **Status**: `[TODO]`

- **5.2: Topologically Animated Interconnect Pipeline Map (NVLink vs PCIe)**
  - **Description**: Add an interactive topological map showing node cluster networking interconnects (NVIDIA HGX NVLink switches vs. PCIe Gen5 lanes). When models are deployed, scaled, or migrated, the UI draws smooth animated particles showing the high-speed transfer speeds and bandwidth saturation rates across host pipelines in real-time.
  - **Status**: `[TODO]`

- **5.3: Model Memory Quantization & Performance Footprint Simulator**
  - **Description**: Integrate a quantization optimizer panel allowing users to choose model precision formats (FP32, FP16, INT8, down to GGUF quantization levels like Q4_K_M and AWQ 4-bit) for the open-source engines. Adjusting precision formats instantly recalculates and graphs the predicted CPU/GPU footprint savings, RTF processing speeds, and expected word accuracy changes.
  - **Status**: `[TODO]`
