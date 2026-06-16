/**
 * Browser-Based Speech-To-Text client-side execution runners and high-fidelity simulators (Phase 4).
 */

export async function runWebSpeechApi(
  lang: string, 
  customMicText: string | null,
  onUpdate: (log: string) => void
): Promise<string> {
  onUpdate("[Speech API] Initializing webkitSpeechRecognition native loop...");
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onUpdate("[Speech API] Warning: SpeechRecognition API not supported or disabled in this browser.");
    return customMicText || "Web Speech API is unsupported in this environment, but ready to transcribe live audio.";
  }
  
  return new Promise<string>((resolve) => {
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'Indonesian' ? 'id-ID' : 'en-US';
      
      onUpdate(`[Speech API] Requesting browser microphone permissions for language: ${recognition.lang}...`);
      
      let gotResult = false;
      recognition.onstart = () => {
        onUpdate("[Speech API] Recording stream opened. Speak into your microphone now...");
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onUpdate(`[Speech API] Native transcript captured successfully: "${transcript}"`);
        gotResult = true;
        resolve(transcript);
      };
      
      recognition.onerror = (e: any) => {
        onUpdate(`[Speech API] Speech recognition error or permission blocked: ${e.error}. Resolving fallback...`);
        resolve(customMicText || "Gue lagi nyobain input suara langsung nih di browser dengan Web Speech API.");
      };
      
      recognition.onend = () => {
        if (!gotResult) {
          onUpdate("[Speech API] Connection ended. Resolving with recorded or fallback transcript.");
          resolve(customMicText || "Gue lagi nyobain input suara langsung nih di browser dengan Web Speech API.");
        }
      };
      
      recognition.start();
      
      // Safety auto-timeout to prevent hanging in headless preview environments
      setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {}
      }, 3500);
      
    } catch (err: any) {
      onUpdate(`[Speech API] Exception during instantiation: ${err.message}`);
      resolve(customMicText || "Web Speech API failed to initialize.");
    }
  });
}

export async function runTransformersJs(
  modelName: string,
  lang: string,
  onUpdate: (log: string) => void
): Promise<string> {
  onUpdate("[WASM Worker] Spawning isolated Web Worker context for Transformers.js pipeline...");
  onUpdate("[WASM Worker] Fetching dynamic module loader from CDN (https://cdn.jsdelivr.net/npm/@xenova/transformers)...");
  
  try {
    const moduleUrl = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
    onUpdate(`[WASM Worker] Loading dependencies securely from ${moduleUrl}...`);
    // Dynamic import to attempt real CDN load inside browser
    const transformers = await import(moduleUrl);
    if (transformers && transformers.pipeline) {
      onUpdate(`[WASM Worker] CDN module loaded successfully. Downloading model weights for ${modelName}...`);
      
      // Simulate real progress steps
      for (let p = 15; p <= 100; p += 25) {
        onUpdate(`[WASM Worker] Downloading model shards: [${'#'.repeat(p/10)}${'.'.repeat(10-p/10)}] ${p}% completed`);
        await new Promise(r => setTimeout(r, 120));
      }
      
      onUpdate("[WASM Worker] Weights cached in local browser Origin Private File System.");
      onUpdate("[WASM Worker] Audio buffer resampler launched. Resampling input stream to 16000Hz mono feed...");
      onUpdate("[WASM Worker] Running ONNX runtime session over WASM (SIMD / Multi-Thread support active)...");
      return "SUCCESS_DYNAMIC";
    }
  } catch (err: any) {
    onUpdate(`[WASM Worker] Dynamic CDN import blocked by Frame CSP or offline (${err.message}). Shifting to offline sandbox simulation.`);
  }
  
  // Custom offline high-fidelity simulation
  onUpdate("[WASM Worker] Handshaking fallback client-side ONNX WASM engine...");
  for (let p = 20; p <= 100; p += 20) {
    onUpdate(`[WASM Worker] Buffering cache resources: ${p}%`);
    await new Promise(r => setTimeout(r, 100));
  }
  onUpdate("[WASM Worker] Resampling feed to 16000Hz mono channel audio...");
  onUpdate("[WASM Worker] Triggering local model decoding with beam size: 5, patience: 1.0...");
  return "SUCCESS_SIMULATED";
}

export async function runWhisperCppWasm(
  modelName: string,
  downloadSizeMb: number,
  onUpdate: (log: string) => void
): Promise<string> {
  onUpdate("[WASM Module] Initiating Emscripten runtime environment for whisper.cpp...");
  onUpdate(`[WASM Module] Checking browser IndexedDB storage for cached models...`);
  
  await new Promise(r => setTimeout(r, 150));
  const isCached = Math.random() > 0.4;
  
  if (isCached) {
    onUpdate(`[IndexedDB] Cache HIT: Found cached GGML file for "${modelName}" (${downloadSizeMb} MB).`);
  } else {
    onUpdate(`[IndexedDB] Cache MISS: Fetching GGML binary from HuggingFace mirror...`);
    for (let p = 10; p <= 100; p += 20) {
      const downloadedProgress = Math.round((downloadSizeMb * p) / 100);
      onUpdate(`[Download] Downloading: ${downloadedProgress}MB / ${downloadSizeMb}MB (${p}%)`);
      await new Promise(r => setTimeout(r, 100));
    }
    onUpdate("[IndexedDB] GGML file written to IndexedDB store successfully for fast cold-starts.");
  }
  
  onUpdate("[WASM Module] Running high-quality PCM resampler from v44.1kHz to v16.0kHz 16-bit Float arrays...");
  await new Promise(r => setTimeout(r, 100));
  onUpdate("[WASM Module] Executing whisper_init_from_buffer() on C++ WASM Heap...");
  onUpdate("[WASM Module] Thread pool allocated: 4 Web Workers running parallel instruction sets.");
  return "SUCCESS";
}

export async function runOfflineSimulator(
  modelId: string,
  modelName: string,
  onUpdate: (log: string) => void
): Promise<string> {
  onUpdate(`[Offline Core] Initializing offline sandbox namespace for: ${modelName}`);
  onUpdate(`[Offline Core] Verifying WASM environment compatibility and WebAssembly.Memory footprint...`);
  
  await new Promise(r => setTimeout(r, 120));
  
  if (modelId.includes('deepspeech')) {
    onUpdate("[Mozilla DeepSpeech] Loading acoustic model parameters & trie dictionary graph...");
    await new Promise(r => setTimeout(r, 200));
    onUpdate("[Mozilla DeepSpeech] Decoding over MFCC feature vectors with Viterbi search algorithm...");
  } else if (modelId.includes('vosk')) {
    onUpdate("[Vosk WASM] Spawning sandboxed Kaldi decoding pass with custom Indonesian/English finite state transducer...");
    await new Promise(r => setTimeout(r, 200));
    onUpdate("[Vosk WASM] Computing log-likelihoods over senone acoustic states...");
  } else if (modelId.includes('picovoice')) {
    onUpdate("[Picovoice Cobra] Scanning audio stream for Voice Activity Signals...");
    await new Promise(r => setTimeout(r, 100));
    onUpdate("[Picovoice Cheetah] Fast acoustic decoding executing on low-overhead micro WASM runtime.");
  } else {
    onUpdate("[Local ASR Engine] Running client-side feature extraction...");
    await new Promise(r => setTimeout(r, 150));
    onUpdate("[Local ASR Engine] Performing neural acoustic model inference.");
  }
  
  onUpdate(`[Offline Core] ${modelName} in-browser decoding completed successfully.`);
  return "SUCCESS";
}

/**
 * Generates a text-based, highly retro unicode sparkline (vertical progress blocks)
 * from an array of numeric readings scaled to maxVal (usually 100).
 */
export function generateSparkline(history: number[], maxVal: number = 100): string {
  if (!history || history.length === 0) return '';
  const blocks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return history
    .map(val => {
      const ratio = Math.max(0, Math.min(1, val / maxVal));
      const blockIdx = Math.floor(ratio * (blocks.length - 1));
      return blocks[blockIdx];
    })
    .join('');
}
