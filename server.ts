import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateMockTranscribe, forwardRealASR } from "./server/sttService.js";
import apiRouter from "./server/apiRouter.js";
import {
  getMockGpuState,
  loadMockModel,
  unloadMockModel,
  moveMockModel,
  fetchLiveGpuState,
  postLiveGpuAction
} from "./server/gpuService.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;


// Setup multer in-memory
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the developer programmatic v1 STT API Router
app.use("/api/v1", apiRouter);

// Retrieve active backend configuration
app.get("/api/config", (req, res) => {
  res.json({
    mode: process.env.ASR_MODE || "mockup",
    realUrl: process.env.REAL_ASR_API_URL || "http://localhost:5000/transcribe",
    realGpuUrl: process.env.REAL_GPU_API_URL || "http://localhost:5000/gpus"
  });
});

// GET active list of cluster GPUs and model registers
app.get("/api/gpus", async (req, res) => {
  const mode = process.env.ASR_MODE || "mockup";
  const realUrl = process.env.REAL_GPU_API_URL || "http://localhost:5000/gpus";

  if (mode === "live" && realUrl) {
    try {
      const state = await fetchLiveGpuState(realUrl);
      return res.json(state);
    } catch (err: any) {
      console.warn("Live GPU API unreachable. Falling back directly to high-fidelity mockup database: ", err.message);
      const state = getMockGpuState();
      return res.json({
        ...state,
        fallbackWarning: `Live ASR GPU Server at ${realUrl} is offline. Using local simulated GPU states.`
      });
    }
  }

  return res.json(getMockGpuState());
});

// POST to load weights onto an active host GPU
app.post("/api/gpus/load", async (req, res) => {
  const { modelId, gpuId } = req.body;
  const mode = process.env.ASR_MODE || "mockup";
  const realUrl = process.env.REAL_GPU_API_URL || "http://localhost:5000/gpus";

  if (mode === "live" && realUrl) {
    try {
      const state = await postLiveGpuAction(realUrl, "load", { modelId, gpuId });
      return res.json(state);
    } catch (err: any) {
      console.error("Live GPU load request failed. Processing on mock fallback instead: ", err.message);
      loadMockModel(modelId, gpuId);
      const state = getMockGpuState();
      return res.json({
        ...state,
        fallbackWarning: `Live ASR GPU Server offline. Loaded model ${modelId} to local fallback sandbox.`
      });
    }
  }

  loadMockModel(modelId, gpuId);
  return res.json(getMockGpuState());
});

// POST to unload weights back to standard disk
app.post("/api/gpus/unload", async (req, res) => {
  const { modelId } = req.body;
  const mode = process.env.ASR_MODE || "mockup";
  const realUrl = process.env.REAL_GPU_API_URL || "http://localhost:5000/gpus";

  if (mode === "live" && realUrl) {
    try {
      const state = await postLiveGpuAction(realUrl, "unload", { modelId });
      return res.json(state);
    } catch (err: any) {
      console.error("Live GPU unload request failed. Processing on mock fallback instead: ", err.message);
      unloadMockModel(modelId);
      const state = getMockGpuState();
      return res.json({
        ...state,
        fallbackWarning: `Live ASR GPU Server offline. Unloaded model from local fallback state.`
      });
    }
  }

  unloadMockModel(modelId);
  return res.json(getMockGpuState());
});

// POST to hot-swap relocate weights to alternative cluster host
app.post("/api/gpus/move", async (req, res) => {
  const { modelId, targetGpuId } = req.body;
  const mode = process.env.ASR_MODE || "mockup";
  const realUrl = process.env.REAL_GPU_API_URL || "http://localhost:5000/gpus";

  if (mode === "live" && realUrl) {
    try {
      const state = await postLiveGpuAction(realUrl, "move", { modelId, targetGpuId });
      return res.json(state);
    } catch (err: any) {
      console.error("Live GPU move request failed. Processing on mock fallback instead: ", err.message);
      moveMockModel(modelId, targetGpuId);
      const state = getMockGpuState();
      return res.json({
        ...state,
        fallbackWarning: `Live ASR GPU Server offline. Relocated model internally to local fallback sandbox.`
      });
    }
  }

  moveMockModel(modelId, targetGpuId);
  return res.json(getMockGpuState());
});

// Primary STT / ASR transcription pipeline
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  try {
    const {
      modelId: bodyModelId,
      model,
      modelName,
      model_id,
      model_name,
      text,
      language = "English",
      isMumbled = "false",
      temperature = "0.2",
      maxTokens = "500",
      vocabBoost
    } = req.body;

    const modelId = bodyModelId || model || modelName || model_id || model_name || "faster-whisper";

    const parsedIsMumbled = isMumbled === "true" || isMumbled === true;
    const parsedTemperature = parseFloat(temperature as string) || 0.2;
    const parsedMaxTokens = parseInt(maxTokens as string) || 500;
    
    // Parse vocabulary boost array
    let parsedVocab: string[] = [];
    if (vocabBoost) {
      if (typeof vocabBoost === "string") {
        try {
          parsedVocab = JSON.parse(vocabBoost);
        } catch {
          parsedVocab = vocabBoost.split(",").map(v => v.trim()).filter(Boolean);
        }
      } else if (Array.isArray(vocabBoost)) {
        parsedVocab = vocabBoost;
      }
    }

    const params = {
      modelId,
      text: text || "To implement the speech recognition server, we spinning up faster-whisper inside a docker container.",
      language,
      isMumbled: parsedIsMumbled,
      temperature: parsedTemperature,
      maxTokens: parsedMaxTokens,
      vocabBoost: parsedVocab
    };

    const mode = process.env.ASR_MODE || "mockup";
    const realUrl = process.env.REAL_ASR_API_URL;

    if (mode === "live" && realUrl) {
      // Forward the file or JSON parameters to the local physical ASR URL
      try {
        if (req.file) {
          // If there is an actual uploaded file, construct multipart data to send
          const FormData = await import("form-data");
          const form = new FormData.default();
          form.append("file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
          });
          form.append("modelId", modelId);
          form.append("language", language);
          form.append("isMumbled", String(parsedIsMumbled));
          form.append("temperature", String(parsedTemperature));
          form.append("maxTokens", String(parsedMaxTokens));
          if (parsedVocab.length > 0) {
            form.append("vocabBoost", JSON.stringify(parsedVocab));
          }

          const response = await forwardRealASR(realUrl, params, form, form.getHeaders());
          res.json(response);
        } else {
          // Send as direct JSON payload
          const response = await forwardRealASR(realUrl, params);
          res.json(response);
        }
      } catch (err: any) {
        console.error("Failed to forward STT request to local live server, routing to mock fallback: ", err.message);
        // Fallback to high-fidelity mock, but flag it as fallback
        const mockResponse = generateMockTranscribe(params);
        res.json({
          ...mockResponse,
          mode: "mockup",
          fallbackWarning: `Real server at ${realUrl} was unreachable. Falling back safely to high-fidelity mockup.`
        });
      }
    } else {
      // Standard mockup operational mode
      const response = generateMockTranscribe(params);
      res.json(response);
    }
  } catch (error: any) {
    console.error("Transcribe API Error: ", error);
    res.status(500).json({ error: error.message || "Internal transcription pipeline failure" });
  }
});

// Configure Vite middleware in development or serve static build files in production
async function run() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[STT-Arena Server] Running on http://localhost:${PORT}`);
    console.log(`[STT-Arena Server] ASR Mode: ${process.env.ASR_MODE || "mockup"}`);
    if (process.env.ASR_MODE === "live") {
      console.log(`[STT-Arena Server] Target Live URL: ${process.env.REAL_ASR_API_URL}`);
    }
  });
}

run();
