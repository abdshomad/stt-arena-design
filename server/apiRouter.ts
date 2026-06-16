import { Router } from "express";
import { CANDIDATE_MODELS, CLOUD_ALTERNATIVES } from "../src/data/modelsData.js";
import { generateMockTranscribe } from "./sttService.js";

const router = Router();

// 1. GET /api/v1/models - Query model performance metrics
router.get("/models", (req, res) => {
  try {
    const { type, indonesianOnly } = req.query;

    const localModels = CANDIDATE_MODELS.map(m => ({
      id: m.id,
      name: m.name,
      engineType: "local",
      sourceType: m.sourceType,
      multilingual: m.multilingual,
      indonesianSupport: m.indonesianSupport,
      emotionDetection: m.emotionDetection,
      mumblingRobustness: m.mumblingRobustness,
      performance: {
        werEnglish: m.werEnglish,
        werIndonesian: m.werIndonesian,
        werMumbled: m.werMumbled,
        latencyMs: m.latencyMs,
        throughputWordsPerSec: m.throughputWordsPerSec,
      },
      requirements: {
        vramRequiredGb: m.vramRequiredGb,
        cpuViability: m.cpuViability,
      },
      license: m.license,
    }));

    const cloudModels = CLOUD_ALTERNATIVES.map(c => ({
      id: c.id,
      name: c.name,
      engineType: "cloud",
      sourceType: "Cloud SaaS API",
      multilingual: true,
      indonesianSupport: true,
      emotionDetection: c.id === "assembly-ai" || c.id === "elevenlabs-stt",
      mumblingRobustness: c.id === "elevenlabs-stt" || c.id === "deepgram-nova-2",
      performance: {
        werEnglish: c.accuracyWer,
        werIndonesian: c.id === "gcp-stt" ? 4.9 : 6.5,
        werMumbled: c.accuracyWer * 1.5,
        latencyMs: c.avgLatencyMs,
        throughputWordsPerSec: c.id === "deepgram-nova-2" ? 320 : 180,
      },
      requirements: {
        vramRequiredGb: 0,
        cpuViability: "Excellent",
      },
      license: "Proprietary",
      costPerMillionWords: c.costPerMillionWords,
    }));

    let allModels = [...localModels, ...cloudModels];

    if (type === "local") {
      allModels = allModels.filter(m => m.engineType === "local");
    } else if (type === "cloud") {
      allModels = allModels.filter(m => m.engineType === "cloud");
    }

    if (indonesianOnly === "true") {
      allModels = allModels.filter(m => m.indonesianSupport);
    }

    res.json({
      status: "success",
      total: allModels.length,
      data: allModels,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2. GET /api/v1/models/:id - Get details for a single model
router.get("/models/:id", (req, res) => {
  try {
    const { id } = req.params;
    const localMatch = CANDIDATE_MODELS.find(m => m.id === id);
    const cloudMatch = CLOUD_ALTERNATIVES.find(c => c.id === id);

    if (!localMatch && !cloudMatch) {
      return res.status(404).json({
        status: "error",
        message: `Model with ID '${id}' not found in the benchmarking index.`,
      });
    }

    const model = localMatch || cloudMatch;
    const isCloud = !!cloudMatch;

    res.json({
      status: "success",
      data: {
        id: model.id,
        name: isCloud ? (model as any).name : (model as any).name,
        engineType: isCloud ? "cloud" : "local",
        multilingual: isCloud ? true : (model as any).multilingual,
        indonesianSupport: isCloud ? true : (model as any).indonesianSupport,
        emotionDetection: isCloud ? (model.id === "assembly-ai" || model.id === "elevenlabs-stt") : (model as any).emotionDetection,
        mumblingRobustness: isCloud ? (model.id === "elevenlabs-stt" || model.id === "deepgram-nova-2") : (model as any).mumblingRobustness,
        performance: {
          werEnglish: isCloud ? (model as any).accuracyWer : (model as any).werEnglish,
          werIndonesian: isCloud ? (model.id === "gcp-stt" ? 4.9 : 6.5) : (model as any).werIndonesian,
          werMumbled: isCloud ? (model as any).accuracyWer * 1.5 : (model as any).werMumbled,
          latencyMs: isCloud ? (model as any).avgLatencyMs : (model as any).latencyMs,
          throughputWordsPerSec: isCloud ? ((model.id === "deepgram-nova-2" ? 320 : 180)) : (model as any).throughputWordsPerSec,
        },
        license: isCloud ? "Proprietary" : (model as any).license,
        ...(isCloud ? { costPerMillionWords: (model as any).costPerMillionWords } : { vramRequiredGb: (model as any).vramRequiredGb }),
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 3. POST /api/v1/transcribe - Transcribe programmatic audio
router.post("/transcribe", (req, res) => {
  try {
    // Basic Bearer Token authentication validation showcase
    const authHeader = req.headers.authorization;
    let authStatus = "guest";
    let keyProvided = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const key = authHeader.substring(7);
      if (key && key.startsWith("stt_live_sk_")) {
        authStatus = "authenticated";
        keyProvided = `${key.substring(0, 15)}...`;
      } else {
        authStatus = "invalid_token";
      }
    }

    const {
      modelId = "faster-whisper",
      text = "To implement the speech recognition server, we are spinning up faster-whisper inside a docker container.",
      language = "English",
      isMumbled = false,
      temperature = 0.2,
      maxTokens = 500,
      vocabBoost = [],
    } = req.body;

    // Utilize high-fidelity simulation engine
    const sttResult = generateMockTranscribe({
      modelId,
      text,
      language,
      isMumbled: String(isMumbled) === "true" || isMumbled === true,
      temperature: parseFloat(String(temperature)),
      maxTokens: parseInt(String(maxTokens)),
      vocabBoost: Array.isArray(vocabBoost) ? vocabBoost : String(vocabBoost).split(","),
    });

    res.json({
      status: "success",
      auth: {
        status: authStatus,
        scope: authStatus === "authenticated" ? "developer_api_access" : "playground_limits",
        keyMeta: keyProvided,
      },
      metrics: {
        model: sttResult.model,
        latencyMs: sttResult.latency_ms,
        wordCount: sttResult.text.split(" ").length,
        languageDetected: sttResult.language,
        emotionDetected: sttResult.detectedEmotion,
      },
      transcript: sttResult.text,
      segments: sttResult.segments,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 4. GET /api/v1/reports/compare - Comparative Report (Local vs Cloud)
router.get("/reports/compare", (req, res) => {
  res.json({
    title: "STT Benchmark: Local Deployments vs Cloud SaaS APIs",
    lastUpdated: "June 2026",
    localSTT: {
      models: ["Whisper Base-to-Large", "Faster-Whisper", "Whisper.cpp", "WhisperX"],
      setupComplexity: "Medium to High (Requires CUDA setups, NVCC compiler layers, and runtime environment isolation)",
      hardwareRequirements: "NVIDIA GPUs with dedicated VRAM (ranging from 1.5GB to 12GB for FP16 inference)",
      offlineViability: "Excellent. Ideal for air-gapped corporate directories, confidential databases, and sovereign state frameworks",
      typicalLatency: "110ms - 380ms depending on CTranslate2 acceleration options and quantization tiers",
      opexModel: "CAPEX-centric. Upfront hardware purchase or fixed GPU cloud billing. Marginal cost of transcribing is zero.",
      pros: [
        "100% data sovereign compliance with no external transmission",
        "Zero token billing fees - limitless processing volume once hardware is acquired",
        "Sub-second offline local latency via compiler level acceleration (Whisper.cpp / Triton)",
        "Deep parameter configurations (temperature controls, custom prompt initialization)"
      ],
      cons: [
        "High initial engineering setup complexity",
        "Idle GPU cluster overhead expenses during non-peak utilization",
        "DevOps burden to manage node health, failovers, and system monitoring",
        "Restricted dynamic hardware autoscaling during spike periods"
      ]
    },
    cloudSTT: {
      services: {
        "Google Cloud Speech-to-Text V2": {
          avgLatencyMs: 250,
          pricing: "$0.024 per minute ($24 / K mins, or $1.44 per hour)",
          customization: "Word-level boost classes, phrase hints, custom vocab adaptation, and model adaptation layers",
          languageSupport: "Extremely rich. 120+ languages including superior support for Indonesian regional dialects (Sundanese, Javanese) and local accents",
          integrationComplexity: "Low. Client SDKs are thoroughly documented with secure OAuth/IAM credentials",
        },
        "Amazon Transcribe": {
          avgLatencyMs: 380,
          pricing: "$0.024 per minute ($24 / K mins)",
          customization: "Custom vocabularies, custom language models (requires training data corpus)",
          languageSupport: "Rich regional support, automatic language identification from multi-speakers",
          integrationComplexity: "Medium. Requires sound AWS IAM configurations and S3 integration pipeline steps",
        },
        "ElevenLabs STT": {
          avgLatencyMs: 190,
          pricing: "$12.00 per hour ($0.20 per minute equivalent for baseline, scaling with plans to $0.05 per minute)",
          customization: "Dynamic prompt engineering and contextual priming support",
          languageSupport: "Exceptional multilingual translation-on-transcription capabilities",
          integrationComplexity: "Low. Single REST post or WebSocket audio chunk streaming",
        }
      },
      opsExpenditure: "Strictly OPEX. Pay-as-you-go elastic model based on second-by-second or minute-by-minute transcribing durations.",
      pros: [
        "Negligible upfront engineering, with 10-minute setup times",
        "Vast scaling capabilities with zero cluster orchestration overhead",
        "State-of-the-art accuracy on difficult accents and mumbled jargon",
        "Premium features out-of-the-box: speaker diarization, sentiments, summarization"
      ],
      cons: [
        "Prohibitive expenses for massive enterprise volume (e.g., 24/7 call centers)",
        "Compliance roadblocks for highly regulated industries (HIPAA, GDPR, Finance)",
        "API latency vulnerable to public network hops and server load conditions"
      ]
    },
    recommendations: [
      {
        scenario: "Real-time Customer Support & Conversational Agents",
        idealEngine: "Cloud APIs (ElevenLabs STT or Google Cloud STT)",
        justification: "Critical voice-agent feedback loop demands minimal initial latency and exceptional capability in understanding colloquial phrasing and mumbling. Low startup cost facilitates rapid iterations, with elastic volume adaptation."
      },
      {
        scenario: "Confidential Offline Enterprise Enterprise Analytics",
        idealEngine: "Local Deployment (Model: Faster-Whisper on L4/A10G GPU nodes)",
        justification: "Massive recording catalog (10K+ hours/month) triggers exponential SaaS billing, while containing proprietary client data that cannot legally leave local host firewalls. Local clusters run at 100% capacity with negligible hourly marginal cost."
      }
    ]
  });
});

export default router;
