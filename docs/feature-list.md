# STT Arena Feature List

An interactive benchmarking dashboard and model arena comparing transcription accuracy (Word Error Rate - WER), latency, and multilingual capabilities across open-source (hosted or local) and commercial cloud Speech-to-Text (STT) engines.

---

## 1. Interactive Leaderboard & Weighting Dynamic Algorithm
The core hub of the dashboard provides immediate ranking across **27 open-source, HuggingFace, and commercial cloud models**, dynamically ordered based on real-time customizable priorities.

- **Interactive Scoring Sliders**: Real-time evaluation weights let developers control:
  - **Transcription Accuracy (WER)**: Calibrates index weighting on Word Error Rate % on clean English, mumbled English, and Indonesian samples.
  - **Processing Latency (RTF)**: Adjusts values to favor fast systems suitable for streaming (less than 200ms real-time latency).
  - **Indonesian Language Priority**: Prioritizes specialized acoustic engines with high-quality vocabularies for standard Indonesian, colloquial dialects, and regional accents.
  - **Hardware Resource Economy**: Rewards low-VRAM open-source models viable on lightweight CPU hardware nodes.
- **Unified Engine Matrix**: Compares 27 models, including:
  - Standard open-source designs (*Whisper Core, faster-whisper, WhisperX, whisper.cpp*).
  - Advanced acoustic architectures (*NVIDIA Nemotron 3.5, Meta Omnilingual, Microsoft Vibe).*
  - Multi-modal/LLM-audio understanding networks (*Google Omni, NVIDIA Nemotron Omni, Google Gemma-4 Audio*).
  - Region-tuned community offerings (*cahya/whisper-medium-id, indonesian-nlp/wav2vec2*).
  - Commercial vendor APIs (*Google Cloud STT, Amazon Transcribe, ElevenLabs, Deepgram, OpenAI Whisper API, AssemblyAI*).
- **Comprehensive Filtration System**:
  - Full-text instant search for model names, IDs, or runtime engines.
  - Quick categorizations based on hosting types (Local, HuggingFace, Cloud SaaS).
  - Quick-toggle tags filtering for:
    - *Multilingual capability* (🌎)
    - *Indonesian Support* (🇮🇩)
    - *Emotion Detection* (🗣️)
    - *Mumbling Robustness* (🌫️)
    - *Indonesia Specific Custom Tuning* (🎯)
  - License filter mapping open-source constraints (*MIT, Apache-2.0, GPL-3.0, CC-BY-NC-4.0, Research Only, Proprietary*).
- **Interactive 2D Scatter/Bubble Performance & Accuracy Matrix**:
  - Plots all active STT engines in a unified coordinate benchmark space, mapping **Processing Latency (ms)** on the X-axis against **Word Error Rate (WER) %** on the Y-axis.
  - Encodes the peak host **VRAM footprint** (local Open Source models) or cost per million words (commercial Cloud SaaS models) dynamically into bubble sizes (Z-axis) to correlate memory overhead.
  - Highlights an elegant shaded green **Optimal Sweet Spot Zone** (under 400ms latency and 5.5% WER) as a reference indicator for high-performance real-time workloads.
  - Synchronizes in real-time with active search queries, host filters, and quick capacity toggles.
  - Allows selecting the specific Y-axis metric from *English Clean WER*, *Indonesian Dialect WER* (with a custom "Hide Unsupported" filter), or *Noisy/Mumbled Speech WER*.
  - Supports direct click-to-pin interactivity where clicking any bubble node instantly pins/unpins that engine inside the floating comparative matrix.
- **Acoustic Detail Peek Hover Panels**: Hovering over any engine spawns a highly legible metadata layout showcasing VRAM footprint, CPU compatibility (Excellent/Good/Poor/Not Feasible), throughput rate (words/second), licensing details, and individual Word Error Rate stats (English Clear, Mumbled, and Indonesian dialect).
- **User-Defined Fast Engine Compare Dock (Pin to Compare)**: 
  - Allows pinning up to 4 models from the leaderboard grid directly into a floating bottom anchor dock.
  - Generates an immersive, deep horizontal benchmarking matrices modal showing side-by-side matches across exact parameters, open-source/commercial licensing, throughput speeds (Words per Second), detailed RTF speeds (Real-Time Factor), and Indonesian regional accent/bilingual slang capability.
  - Supports direct workload routing inside the Comparative Arena using dual "Set Model" action buttons on each model column inside the matrix.
- **Dataset-Specific Weight Profile Selectors**: 
  - Provides instant weighting presets tailored to industry workloads such as *Call Center Analytics*, *Medical Dictations*, *Bilingual Interviews*, or *Indonesian Slang Heavy*.
  - Selecting a preset dynamically recalibrates Accuracy, Latency, Indonesian Support, and Hardware economy weights with synchronized slider transitions.

---

## 2. Dynamic Comparative Arena Simulator
An interactive battleground to view relative output matches between any two state-of-the-art ASR models against benchmark data or live inputs.

- **Two-Model Concurrent Arena**: Set Engine A and Engine B side-by-side to benchmark transcription matches.
- **Preset Difficulty Sample Bank**: Play and test 5 high-fidelity audio samples, representing typical real-world speech hurdles:
  - **Clear English**: *Developer Quick Pitch* (crisp, clear pronunciation of technical concepts).
  - **Mumbled English**: *Coffee Shop Gossip* (ambient room noise, fast-talking, background music).
  - **Official Indonesian**: *Gubernur DKI Berbicara* (perfect formal articulation of urban updates).
  - **Bilingual Slang**: *Anak Jaksel Hangout* (rapid code-switching, mixing indonesian & english colloquialisms literally).
  - **Mumbled/Noisy Indonesian**: *Warung Kopi Berisik* (high background laughter, plate clinking, Javanese/colloquial words).
- **Interactive Live Voice Microphone Recording**:
  - Leverages HTML5 web microphone permissions inside the browser workspace.
  - Interactive visual waveform recorder mapping capture peaks.
  - Compiles live recordings directly into the comparison engine as Custom Microphone tasks.
- **SOTA Word Decoding & Voice Pipeline Simulation Logs**:
  - Animates progressive, staggered typing effects of text output during decoding, showing real-time feedback.
  - Progress bar paired with a rolling debug log mirroring local environment allocation: allocation of system VRAM, VAD (Voice Activity Detection) triggers, beam-search optimization threads, and dynamic timestamp reconciliation.
- **Interactive Error Realism Generator**:
  - Modulates transcript outputs according to each model's Word Error Rate (Clean English vs Mumbled vs Indonesian support).
  - Simulates genuine speech transcription errors including phonetic misspellings, mumbled word dropouts (`____`), double-words, casing issues, or unhandled language failures.
- **Emotion & Metadata Analysis**: Real-time extraction of emotional tone or speaker metadata matching model specifications.
- **Multi-Turn Conversation & Speaker Diarization Arena (Dialogue Mode)**:
  - Supports a dedicated toggle to benchmark model performance on multi-turn dialogue recordings or simulated customer calls.
  - Renders an interactive staggered conversational timeline displaying speaker segmentations ("Speaker 0" and "Speaker 1") with sub-second timestamps.
  - Plots speaker overlaps and text alignments face-to-face to verify alignment robustness under conversational stress.
  - Dynamically updates the verdict card based on the models' diarization and overlap isolation attributes.
- **Dual-Speaker Dialogue Conversation Builder**:
  - Exposes an interactive, built-in dialogue segment designer to construct custom conversations.
  - Includes an editable timing table to adjust speaker ID assignments, text transcript segments, and precise millisecond timing intervals.
  - Features high-contrast helper tools like *Simulate Overlap* (instantly forcing crosstalk alignment to test model diarization robustness) and *Sequential Align* (snapping segments consecutively with uniform gaps).
  - Integrates automated real-time overlap validation with diagnostics alerts detecting exact collision timeframes.
  - Automatically saves the custom profiles to the browser's persistent `localStorage` for rapid reload or playground comparisons.
- **Interactive Audio Segment Slicer & Waveform Playhead Visualizer**:
  - Replaces traditional static waveform visuals with an interactive, zoomable timeline component supporting up to 4x zoom levels for granular sub-second tick inspections.
  - Houses active range-clipping sliders to bracket and isolate bilingual phrase-overlays or high-jargon colloquialisms.
  - Synchronizes active clip periods with ASR benchmarks, bounding comparative model decoding text arrays specifically to the isolated frame slice.
  - Integrates a clickable word-timestamp map enabling developers to click direct words within the transcript, jumping the playhead and triggering micro-segment preview audio loops.
- **Custom Audio Uploader & URL Paste Parser**:
  - Integrates an interactive drag-and-drop zone supporting WAV/MP3 files up to 10MB, plus direct URL paste targets.
  - Dynamically extracts audio duration and peak envelopes on-the-fly using the Web Audio API (`AudioContext`).
  - Supports custom language configuration (English, Indonesian, Mixed) and custom transcript input overlays.
  - Incorporates adjustable playback speed controls (0.5x, 1x, 2x) on the waveform playhead, scaling simulation speeds and synchronizing native HTML5 audio playback speeds correspondingly.

---

## 3. High-Fidelity Cost Calculator (Cloud vs. Local GPU Clusters)
Provides direct financial analysis and infrastructure projections comparing local custom GPU nodes (NVIDIA hardware cluster) against pay-as-you-go APIs from commercial SaaS vendors.

- **Workload Slider Selection**: Dynamically sliding estimated monthly transcription hours (ranging from 100 to dense commercial use of 10,000+ hours).
- **Dedicated Local Node Cluster Recommendation Engine**:
  - Estimates specific GPU counts (NVIDIA A10G, T4, or A100 tensors) based on Real-Time Factor (RTF) speeds to maintain continuous service.
  - Aggregates server hardware monthly rental rates, network bandwidth egress cost, and devops support salaries (overhead costs).
- **Pay-As-You-Go API Comparative Model**:
  - Computes monthly total price scaling across Google Cloud STT V2, Amazon Transcribe, ElevenLabs, Deepgram Nova-2, OpenAI Whisper API, and AssemblyAI.
  - Displays transparent Cost per Million Words alongside absolute monthly spend, enabling developers to find the exact financial breakeven points.
- **3-Year Total Cost of Ownership (TCO) & Break-Even Simulator**:
  - Direct, interactive line/area chart graphing 3-year TCO expenditure streams for self-hosted local nodes versus SaaS licensing alternatives.
  - Prominently isolates and visualizes the exact break-even point where capital setup depreciation crosses and becomes significantly cheaper than continuous API payloads.

---

## 4. Production Integration Deployment Blueprints (SDK Center)
Actionable, copy-pasteable runtime integrations allowing immediate code migration from the benchmark simulator to active microservices.

- **Multi-Framework Language Selector**:
  - **Python FastAPI**: Exposes standard WebSocket integrations with `faster-whisper` for live frame transcription.
  - **Node.js (Express)**: Provides multi-tenant backend triggers for parsing WAV audio chunks via REST.
  - **Go (Golang)**: Implements ultra-efficient streaming channels.
  - **Python CLI (local)**: Demonstrates boilerplate loading of custom HuggingFace models using the `transformers` ecosystem.
- **Developer Features**:
  - Elegant syntax-colored representation of production blocks.
  - Immediate clipboard copying with real-time HUD feedback.
- **Live Client API Configuration Sandbox**:
  - Integrates interactive inputs to configure connection keys, specialized vocabulary word-lists, decoding temperatures, and context chunk boundaries.
  - Parametric variables immediately synchronize live directly inside of Python request libraries, Node.js Axios configurations, and Golang stream structures.

---

## 5. Live HPC GPU Cluster & Model Orchestration Dashboard
An interactive hardware-level cluster scheduler cockpit to manage high-performance compute nodes dynamically.

- **GPU Node Clusters Telemetry**:
  - Monitors 4 physical GPUs: **NVIDIA H100 SXM5 (80GB)**, **NVIDIA A100 PCIe (40GB)**, **NVIDIA RTX 4090 (24GB)**, and **NVIDIA T4 (16GB)**.
  - Streams real-time heat indexes (temperature in °C), system power wattage (draw/limits), fan/matrix compute utilisation%, and active load statuses.
- **Model Card Registry Catalog**:
  - Displays rich model capabilities cards with parameters, binary format types (FP16, Q4_K_M GGUF), weights footprints (GB), and functional tags with custom registry filtering.
- **Dynamic Scheduler Controls & Actions**:
  - **Load Model**: Mounts unallocated models to custom selected GPU nodes, dynamically checking VRAM register pools to prevent out-of-memory failure overflows. Animated progressive loading bars visualises real-time load stages.
  - **Unload Model**: Frees up local device memory channels instantly, returning VRAM block capacities and lowering temperatures/idle cooling draws.
  - **Reschedule / Move Model**: Swaps a loaded model smoothly from an originating host to a target GPU node, executing hot-swap routines.
- **Real-Time Orchestrator Logs Terminal**:
  - A real-time, terminal-like telemetry scroll monitoring BIOS, CUDA mounts, VAD frame segmentations, and allocation changes smoothly.

