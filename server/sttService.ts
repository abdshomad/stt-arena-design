import axios from "axios";
import { CANDIDATE_MODELS, CLOUD_ALTERNATIVES } from "../src/data/modelsData.js";
import { STTModel } from "../src/types.js";

export interface STTParams {
  modelId: string;
  text?: string;
  language?: string;
  isMumbled?: boolean;
  temperature?: number;
  maxTokens?: number;
  vocabBoost?: string[];
}

export interface STTResponse {
  text: string;
  language: string;
  detectedEmotion: string | null;
  mode: "mockup" | "live";
  latency_ms: number;
  model: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speakerId: number;
    words: Array<{
      word: string;
      start: number;
      end: number;
      probability: number;
    }>;
  }>;
}

// Locate engine database details from our rich models list
export function getModelMetadata(modelIdOrName: string): any {
  if (!modelIdOrName) modelIdOrName = "faster-whisper";
  const normalizedInput = modelIdOrName.trim().toLowerCase();

  const localModel = CANDIDATE_MODELS.find(
    m => m.id.toLowerCase() === normalizedInput || m.name.toLowerCase() === normalizedInput
  );
  if (localModel) return { ...localModel, isCloud: false };

  const cloudModel = CLOUD_ALTERNATIVES.find(
    c => c.id.toLowerCase() === normalizedInput || c.name.toLowerCase() === normalizedInput
  );
  if (cloudModel) {
    return {
      id: cloudModel.id,
      name: cloudModel.name,
      multilingual: true,
      indonesianSupport: true,
      emotionDetection: cloudModel.id === "assembly-ai" || cloudModel.id === "elevenlabs-stt",
      mumblingRobustness: cloudModel.id === "elevenlabs-stt" || cloudModel.id === "deepgram-nova-2",
      indonesiaSpecific: false,
      werEnglish: cloudModel.accuracyWer,
      werIndonesian: cloudModel.id === "gcp-stt" ? 4.9 : 6.5,
      werMumbled: cloudModel.accuracyWer * 1.5,
      latencyMs: cloudModel.avgLatencyMs,
      vramRequiredGb: 0,
      isCloud: true
    };
  }

  // Fallback default
  return {
    id: modelIdOrName,
    name: modelIdOrName,
    multilingual: true,
    indonesianSupport: true,
    emotionDetection: false,
    mumblingRobustness: false,
    indonesiaSpecific: false,
    werEnglish: 5.0,
    werIndonesian: 10.0,
    werMumbled: 12.0,
    latencyMs: 250,
    vramRequiredGb: 4.0,
    isCloud: false
  };
}

// Generate a realistic transcribed text with errors based on Word Error Rate (WER) and temperature parameters
export function simulateTranscription(
  originalText: string,
  model: any,
  isIndo: boolean,
  isMumbled: boolean,
  temperature: number,
  vocabBoost: string[] = []
): string {
  if (isIndo && !model.indonesianSupport) {
    return `[UNSUPPORTED LANGUAGE ERROR] ${originalText.split(" ").slice(0, 5).join(" ")}... (Mismatched tokenizer/dictionary vocabulary limits)`;
  }

  // Calculate base operational error rate (WER)
  let errorRate = model.werEnglish;
  if (isIndo) {
    errorRate = model.werIndonesian;
  }
  if (isMumbled) {
    errorRate = Math.max(errorRate, model.werMumbled);
  }

  // High temperature increases degradation risk
  if (temperature > 0.6) {
    errorRate += (temperature - 0.5) * 15;
  }

  const words = originalText.split(/\s+/).filter(Boolean);
  const normalizedBoost = vocabBoost.map(v => v.toLowerCase());

  const processedWords = words.map((w, idx) => {
    const wordLower = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    
    // Check if vocabulary boost recovers potential inaccuracies
    const isBoosted = normalizedBoost.some(term => term.includes(wordLower) || wordLower.includes(term));
    const finalErrorRate = isBoosted ? Math.max(1, errorRate * 0.15) : errorRate;

    const seed = Math.random() * 100;
    if (seed < finalErrorRate) {
      if (seed < finalErrorRate * 0.3) {
        // Word drop / deletion
        return "";
      } else if (seed < finalErrorRate * 0.65) {
        // Unconfident pronunciation / spelling variation
        if (w.toLowerCase() === "cahya") return "saya";
        if (w.toLowerCase() === "whisper") return "wisper";
        if (w.toLowerCase() === "jujurly") return "jujur";
        return w.substring(0, Math.max(2, w.length - 2)) + "...";
      } else {
        // Repeated phrase or casing breakdown
        return w.toLowerCase();
      }
    }
    return w;
  });

  return processedWords.filter(Boolean).join(" ");
}

// Orchestrate the mock STT generation including speaker-diarized segments and confidence levels
export function generateMockTranscribe(params: STTParams): STTResponse {
  const {
    modelId,
    text = "To implement the speech recognition server, we spinning up faster-whisper inside a docker container.",
    language = "English",
    isMumbled = false,
    temperature = 0.2,
    vocabBoost = []
  } = params;

  const model = getModelMetadata(modelId);
  const isIndo = language.toLowerCase().includes("indo");
  
  // Calculate simulated transcription output text
  const outputText = simulateTranscription(text, model, isIndo, isMumbled, temperature, vocabBoost);
  
  // Latency calculation with minor natural noise
  const rawLatency = model.latencyMs || 250;
  const latency_ms = Math.round(rawLatency * (0.85 + Math.random() * 0.3));

  // Emotion determination
  let detectedEmotion: string | null = null;
  if (model.emotionDetection) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("jujurly") || lowerText.includes("epic") || lowerText.includes("sanget")) {
      detectedEmotion = "Casual / Tech Slang (Excited)";
    } else if (isMumbled) {
      detectedEmotion = "Neutral / Mumbled Speech";
    } else {
      detectedEmotion = "Informational / Flat Tone";
    }
  }

  // Construct word-level timestamps and segments
  const outputWords = outputText.split(/\s+/).filter(Boolean);
  const numWords = outputWords.length;
  const segmentDuration = 4.0; // standard mock audio length
  
  const segments: STTResponse["segments"] = [];
  
  // Model provides diarization if it's cloud premium or large local models
  const supportsDiarization = modelId === "elevenlabs-stt" || modelId === "gcp-stt" || modelId === "assembly-ai" || modelId.includes("omni") || modelId.includes("diarization");

  if (numWords > 0) {
    const wordsPerSegment = Math.min(8, Math.ceil(numWords / 3) || 1);
    let wordIdx = 0;
    let seq = 0;
    
    while (wordIdx < numWords) {
      const segmentWords = outputWords.slice(wordIdx, wordIdx + wordsPerSegment);
      const isFirstHalf = wordIdx < numWords / 2;
      const speakerId = supportsDiarization ? (isFirstHalf ? 0 : 1) : 0;
      
      const start = parseFloat((seq * segmentDuration).toFixed(2));
      const end = parseFloat(((seq + 1) * segmentDuration).toFixed(2));
      const textChunk = segmentWords.join(" ");

      const wordList = segmentWords.map((word, wIdx) => {
        const wStart = parseFloat((start + (wIdx * (segmentDuration / segmentWords.length))).toFixed(2));
        const wEnd = parseFloat((wStart + 0.3).toFixed(2));
        return {
          word,
          start: wStart,
          end: wEnd,
          probability: parseFloat((0.85 + Math.random() * 0.15).toFixed(3))
        };
      });

      segments.push({
        start,
        end,
        text: textChunk,
        speakerId,
        words: wordList
      });

      wordIdx += wordsPerSegment;
      seq++;
    }
  }

  return {
    text: outputText,
    language: isIndo ? "Indonesian" : "English",
    detectedEmotion,
    mode: "mockup",
    latency_ms,
    model: model.name,
    segments
  };
}

// Proxies ASR request to the real local server
export async function forwardRealASR(
  apiUrl: string,
  params: STTParams,
  fileStream?: any,
  fileHeaders?: any
): Promise<STTResponse> {
  // Build headers
  const headers = {
    ...fileHeaders,
    "X-Forwarded-For-ASR": "STT-Arena-Gateway"
  };

  // Re-run standard POST to physical server 
  const response = await axios.post(apiUrl, fileStream || params, {
    headers,
    timeout: 30000 // 30 seconds max timeout
  });

  // Ensure returned object matches our UI format
  const data = response.data;
  return {
    text: data.text || data.transcript || JSON.stringify(data),
    language: data.language || "Detected / Real",
    detectedEmotion: data.detectedEmotion || data.emotion || null,
    mode: "live",
    latency_ms: data.latency_ms || data.time_taken || 450,
    model: params.modelId,
    segments: data.segments || []
  };
}
