import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GpuModelManager } from './components/GpuModelManager';
import { CompareDock } from './components/CompareDock';
import { WeightPresets } from './components/WeightPresets';
import { TcoLineChart } from './components/TcoLineChart';
import { ApiPayloadGenerator } from './components/ApiPayloadGenerator';
import { ApiSandbox } from './components/ApiSandbox';
import { ComparativeAnalysisReport } from './components/ComparativeAnalysisReport';
import { 
  Activity, 
  Award, 
  BarChart3, 
  BookOpen, 
  Brain, 
  ChevronRight, 
  Cpu, 
  DollarSign, 
  Download, 
  FileAudio, 
  Filter, 
  Globe, 
  Info, 
  LayoutGrid, 
  ListCollapse, 
  ListFilter, 
  Mic, 
  Play, 
  RefreshCw, 
  Server, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Scale, 
  Terminal, 
  HardDrive, 
  HelpCircle, 
  Code, 
  Sliders, 
  Search, 
  ExternalLink, 
  Copy, 
  Layers, 
  SlidersHorizontal,
  Lightbulb,
  Zap,
  Network,
  TrendingUp,
  Trash2
} from 'lucide-react';

import { CANDIDATE_MODELS, CLOUD_ALTERNATIVES, AUDIO_SAMPLES } from './data/modelsData';
import { DIALOGUE_PROFILES } from './data/dialogueData';
import { DialogueArena } from './components/DialogueArena';
import { DialogueBuilder } from './components/DialogueBuilder';
import AudioSlicerWaveform from './components/AudioSlicerWaveform';
import LeaderboardScatterChart from './components/LeaderboardScatterChart';
import { CustomAudioUploader } from './components/CustomAudioUploader';
import { STTModel, CloudAlternative, AudioSample } from './types';
import { runWebSpeechApi, runTransformersJs, runWhisperCppWasm, runOfflineSimulator, generateSparkline } from './lib/browserSttRunners';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';

export default function App() {
  // Tabs: 'gpu' | 'leaderboard' | 'arena' | 'cloud' | 'docs'
  const [activeTab, setActiveTab] = useState<'gpu' | 'leaderboard' | 'arena' | 'cloud' | 'docs'>('gpu');
  
  // Real full-stack ASR backend metadata & connection check
  const [apiConfig, setApiConfig] = useState<{ mode: 'mockup' | 'live'; realUrl: string } | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setApiConfig(data);
        console.log("Loaded ASR Gateway Config successfully:", data);
      })
      .catch(err => {
        console.error("Failed to retrieve ASR Gateway Config:", err);
      });
  }, []);

  // Model family and status sync states (Phase 3)
  const [modelStatuses, setModelStatuses] = useState<{ [id: string]: string }>({});
  const [actualLatencyA, setActualLatencyA] = useState<number | null>(null);
  const [actualLatencyB, setActualLatencyB] = useState<number | null>(null);

  const getModelFamilyName = (m: STTModel) => {
    const name = m.name.toLowerCase();
    const id = m.id.toLowerCase();
    const source = m.sourceType.toLowerCase();

    if (id.startsWith('browser-') || source.includes('browser') || id.includes('deepspeech') || id.includes('vosk') || id.includes('picovoice')) {
      return 'Browser-Based Engines';
    } else if (id.includes('whisper') || name.includes('whisper')) {
      return 'Whisper Family';
    } else if (id.includes('nvidia') || name.includes('nvidia') || name.includes('nemotron')) {
      return 'NVIDIA Family';
    } else if (id.includes('google') || name.includes('google') || name.includes('gemma')) {
      return 'Google Family';
    } else if (id.includes('meta') || name.includes('meta') || name.includes('mms')) {
      return 'Meta Family';
    } else if (id.includes('microsoft') || name.includes('microsoft')) {
      return 'Microsoft Family';
    } else {
      return 'Other Models';
    }
  };

  const groupedFighters = useMemo(() => {
    const groups: { [key: string]: STTModel[] } = {
      'Whisper Family': [],
      'NVIDIA Family': [],
      'Google Family': [],
      'Meta Family': [],
      'Microsoft Family': [],
      'Browser-Based Engines': [],
      'Other Models': []
    };
    CANDIDATE_MODELS.forEach(m => {
      const family = getModelFamilyName(m);
      groups[family].push(m);
    });
    return groups;
  }, []);

  const syncAllModelStatuses = () => {
    fetch('/api/gpus')
      .then(res => res.json())
      .then(data => {
        if (data && data.models) {
          const statuses: { [id: string]: string } = {};
          // Load statuses from server-side GPUS models
          data.models.forEach((m: any) => {
            statuses[m.id] = m.status;
          });
          
          // Load statuses from localStorage for browser models
          const stored = localStorage.getItem('stt_browser_model_statuses');
          if (stored) {
            try {
              const browserStatuses = JSON.parse(stored);
              Object.keys(browserStatuses).forEach(k => {
                statuses[k] = browserStatuses[k];
              });
            } catch (e) {
              console.error("Failed to parse browser model statuses:", e);
            }
          } else {
            // Default browser statuses
            CANDIDATE_MODELS.forEach(m => {
              if (m.id.startsWith('browser-')) {
                statuses[m.id] = m.id === "browser-web-speech-api" ? "loaded" : "unloaded";
              }
            });
          }
          setModelStatuses(statuses);
        }
      })
      .catch(() => {
        const statuses: { [id: string]: string } = {};
        const stored = localStorage.getItem('stt_browser_model_statuses');
        if (stored) {
          try {
            const browserStatuses = JSON.parse(stored);
            Object.keys(browserStatuses).forEach(k => {
              statuses[k] = browserStatuses[k];
            });
          } catch (e) {}
        } else {
          CANDIDATE_MODELS.forEach(m => {
            if (m.id.startsWith('browser-')) {
              statuses[m.id] = m.id === "browser-web-speech-api" ? "loaded" : "unloaded";
            }
          });
        }
        setModelStatuses(statuses);
      });
  };

  useEffect(() => {
    syncAllModelStatuses();
    const interval = setInterval(syncAllModelStatuses, 2500);
    
    // Also listen to window updates
    const handleSyncEvent = () => {
      syncAllModelStatuses();
    };
    window.addEventListener('stt-models-updated', handleSyncEvent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stt-models-updated', handleSyncEvent);
    };
  }, []);

  const isModelActive = (modelId: string) => {
    const candidate = CANDIDATE_MODELS.find(c => c.id === modelId);
    if (!candidate) return true;
    
    const status = modelStatuses[modelId];
    if (status !== undefined) {
      return status === 'loaded';
    }
    return true;
  };

  // Sliders for dynamic custom weights
  const [weights, setWeights] = useState({
    accuracy: 40,
    latency: 30,
    indonesian: 20,
    resource: 10
  });

  // Reset weights
  const resetWeights = () => {
    setWeights({
      accuracy: 40,
      latency: 30,
      indonesian: 20,
      resource: 10
    });
  };

  // State for Leaderboard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMultilingual, setFilterMultilingual] = useState(false);
  const [filterIndonesian, setFilterIndonesian] = useState(false);
  const [filterEmotion, setFilterEmotion] = useState(false);
  const [filterMumbling, setFilterMumbling] = useState(false);
  const [filterIndoSpecific, setFilterIndoSpecific] = useState(false);
  const [filterSourceType, setFilterSourceType] = useState<string>('All');
  const [selectedLicense, setSelectedLicense] = useState<string>('All');
  const [hoveredModel, setHoveredModel] = useState<any | null>(null);

  // Compare Dock Pinning States
  const [pinnedModelIds, setPinnedModelIds] = useState<string[]>([]);

  const handlePinModel = (id: string) => {
    setPinnedModelIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert("Maximum of 4 models can be pinned for side-by-side comparison matrix. Please unpin an existing model first!");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleUnpin = (id: string) => {
    setPinnedModelIds((prev) => prev.filter((item) => item !== id));
  };

  const handleClearAllPinned = () => {
    setPinnedModelIds([]);
  };

  const handleLaunchArena = (id: string, slot: 'A' | 'B') => {
    if (slot === 'A') {
      setArenaModelA(id);
    } else {
      setArenaModelB(id);
    }
    setActiveTab('arena');
  };

  // Computed Unified Leaderboard Data containing both local and cloud platforms
  const calculatedLeaderboard = useMemo(() => {
    const localMapped = CANDIDATE_MODELS.map(model => ({ ...model, isCloud: false }));
    
    const cloudMapped = CLOUD_ALTERNATIVES.map(c => {
      let werIndo = 6.5;
      if (c.id === 'gcp-stt') werIndo = 4.9; // GCP is superior for regional accents
      if (c.id === 'deepgram-nova-2') werIndo = 7.1;
      if (c.id === 'aws-transcribe') werIndo = 8.2;

      let werMumb = c.accuracyWer * 1.5;
      if (c.id === 'elevenlabs-stt') werMumb = 4.8; // Elevenlabs is extremely robust to mumbling
      if (c.id === 'deepgram-nova-2') werMumb = 6.4;

      return {
        id: c.id,
        name: c.name,
        multilingual: true,
        indonesianSupport: true,
        emotionDetection: c.id === 'assembly-ai' || c.id === 'elevenlabs-stt',
        mumblingRobustness: c.id === 'elevenlabs-stt' || c.id === 'deepgram-nova-2',
        indonesiaSpecific: false,
        sourceType: 'Cloud SaaS API' as any,
        werEnglish: c.accuracyWer,
        werIndonesian: werIndo,
        werMumbled: werMumb,
        latencyMs: c.avgLatencyMs,
        vramRequiredGb: 0,
        cpuViability: 'Excellent' as const,
        throughputWordsPerSec: c.id === 'deepgram-nova-2' ? 320 : 180,
        license: 'Proprietary' as const,
        isCloud: true,
        company: c.company,
        costPerMillionWords: c.costPerMillionWords
      };
    });

    const unified = [...localMapped, ...cloudMapped];

    return unified.map(model => {
      // Accuracy Score component: incorporates both English clear, mumbled, and Indonesian.
      const engAcc = Math.max(0, 100 - model.werEnglish * 8);
      const mumbledAcc = Math.max(0, 100 - model.werMumbled * 5);
      const indonesianAcc = model.werIndonesian === 99 
        ? 30 
        : Math.max(0, 100 - model.werIndonesian * 6);

      const accuracyScore = (engAcc * 0.4) + (mumbledAcc * 0.3) + (indonesianAcc * 0.3);

      // Latency Score (0-100): Lower latency is better.
      const latencyScore = Math.max(10, 100 - (model.latencyMs / 4.8));

      // Indonesian Support score
      const indoScore = model.indonesiaSpecific 
        ? 100 
        : (model.indonesianSupport ? 70 : 0);

      // Resource score (Lower VRAM is better). Cloud APIs excel because they require zero local resources.
      const resourceScore = model.isCloud ? 98 : Math.max(15, 100 - (model.vramRequiredGb * 5));

      // Calculate weighted average
      const totalWeight = weights.accuracy + weights.latency + weights.indonesian + weights.resource || 1;
      const finalScore = (
        accuracyScore * weights.accuracy +
        latencyScore * weights.latency +
        indoScore * weights.indonesian +
        resourceScore * weights.resource
      ) / totalWeight;

      return {
        ...model,
        customScore: parseFloat(finalScore.toFixed(1)),
        accuracyMetric: parseFloat(accuracyScore.toFixed(1)),
        latencyMetric: parseFloat(latencyScore.toFixed(1)),
        resourceMetric: parseFloat(resourceScore.toFixed(1)),
        indoMetric: parseFloat(indoScore.toFixed(1))
      };
    }).sort((a, b) => b.customScore - a.customScore);
  }, [weights]);

  // Filtered leaderboard list
  const filteredLeaderboard = useMemo(() => {
    return calculatedLeaderboard.filter(model => {
      const matchSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          model.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMultilingual = !filterMultilingual || model.multilingual;
      const matchIndonesian = !filterIndonesian || model.indonesianSupport;
      const matchEmotion = !filterEmotion || model.emotionDetection;
      const matchMumbling = !filterMumbling || model.mumblingRobustness;
      const matchIndoSpecific = !filterIndoSpecific || model.indonesiaSpecific;
      
      const matchSource = filterSourceType === 'All' || 
        (filterSourceType === 'Local' && model.sourceType.startsWith('Local')) ||
        (filterSourceType === 'HuggingFace' && model.sourceType === 'HuggingFace') ||
        (filterSourceType === 'Cloud' && model.sourceType === 'Cloud SaaS API');

      const matchLicense = selectedLicense === 'All' || model.license === selectedLicense;

      return matchSearch && matchMultilingual && matchIndonesian && matchEmotion && matchMumbling && matchIndoSpecific && matchSource && matchLicense;
    });
  }, [calculatedLeaderboard, searchQuery, filterMultilingual, filterIndonesian, filterEmotion, filterMumbling, filterIndoSpecific, filterSourceType, selectedLicense]);

  // Selected models for comparison
  const pinnedModels = useMemo(() => {
    return calculatedLeaderboard.filter(m => pinnedModelIds.includes(m.id));
  }, [calculatedLeaderboard, pinnedModelIds]);


  // ================= ARENA SIMULATOR STATES =================
  const [arenaModelA, setArenaModelA] = useState<string>('faster-whisper');
  const [arenaModelB, setArenaModelB] = useState<string>('cahya-faster-whisper-medium-id');
  const [activeSampleId, setActiveSampleId] = useState<string>(AUDIO_SAMPLES[3].id); // default 'slang_id'
  const [customUploadedSample, setCustomUploadedSample] = useState<(AudioSample & { audioUrl?: string }) | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurSec, setRecordingDurSec] = useState(0);
  const [recordingPeaks, setRecordingPeaks] = useState<number[]>([]);
  const [micSampleTranscript, setMicSampleTranscript] = useState<string>("");
  const [isArenaProcessing, setIsArenaProcessing] = useState(false);
  const [arenaProgress, setArenaProgress] = useState(0); // 0 to 100
  const [arenaLogs, setArenaLogs] = useState<string[]>([]);
  const [cpuLoad, setCpuLoad] = useState<number>(0);
  const [gpuLoad, setGpuLoad] = useState<number>(0);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [gpuHistory, setGpuHistory] = useState<number[]>([]);
  const [completedBattle, setCompletedBattle] = useState(false);
  const [realtimeTextA, setRealtimeTextA] = useState('');
  const [realtimeTextB, setRealtimeTextB] = useState('');
  const [detectedEmotionA, setDetectedEmotionA] = useState<string | null>(null);
  const [detectedEmotionB, setDetectedEmotionB] = useState<string | null>(null);
  const [copiedCodeTab, setCopiedCodeTab] = useState<string | null>(null);

  const [arenaMode, setArenaMode] = useState<'single' | 'dialogue'>('single');
  const [dialogueProfiles, setDialogueProfiles] = useState<any[]>(() => {
    const stored = localStorage.getItem('stt_custom_dialogue_profiles') || localStorage.getItem('vox_custom_dialogue_profiles');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return DIALOGUE_PROFILES;
  });
  const [activeDialogueProfileId, setActiveDialogueProfileId] = useState<string>('customer_support_telco');
  const [isEditingDialogue, setIsEditingDialogue] = useState(false);

  const activeDialogueProfile = useMemo(() => {
    return dialogueProfiles.find(p => p.id === activeDialogueProfileId) || dialogueProfiles[0] || DIALOGUE_PROFILES[0];
  }, [dialogueProfiles, activeDialogueProfileId]);

  // Selected sample object
  const activeSample = useMemo(() => {
    if (activeSampleId === 'custom-mic') {
      return {
        id: 'custom-mic',
        name: 'My Live Voice Recording',
        language: 'Indonesian / English Mixed',
        difficulty: 'Medium' as const,
        description: 'Simulated custom voice input from your dashboard microphone.',
        transcript: micSampleTranscript || 'Halo halo, selamat sore semuanya, selamat datang di Speech to Text Model Arena.',
        mumbled: false,
        audioDurationSecs: Math.max(3, recordingDurSec),
        mockWaveform: recordingPeaks.length > 0 ? recordingPeaks : [0.1, 0.4, 0.8, 0.5, 0.2, 0.6, 0.4, 0.8, 0.3, 0.1]
      };
    }
    if (activeSampleId === 'custom-audio' && customUploadedSample) {
      return customUploadedSample;
    }
    return AUDIO_SAMPLES.find(s => s.id === activeSampleId) || AUDIO_SAMPLES[0];
  }, [activeSampleId, micSampleTranscript, recordingDurSec, recordingPeaks, customUploadedSample]);

  // Model object references for Arena selection
  const modelAObj = useMemo(() => CANDIDATE_MODELS.find(m => m.id === arenaModelA) || CANDIDATE_MODELS[0], [arenaModelA]);
  const modelBObj = useMemo(() => CANDIDATE_MODELS.find(m => m.id === arenaModelB) || CANDIDATE_MODELS[1], [arenaModelB]);

  const hasActiveBrowserModel = useMemo(() => {
    const isModelABrowser = arenaModelA.startsWith('browser-') || modelAObj.sourceType.includes('Browser');
    const isModelBBrowser = arenaModelB.startsWith('browser-') || modelBObj.sourceType.includes('Browser');
    return isModelABrowser || isModelBBrowser;
  }, [arenaModelA, arenaModelB, modelAObj, modelBObj]);

  // Clip start/end states for synchronized clipping
  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number | null>(null);

  const totalDuration = useMemo(() => {
    return arenaMode === 'dialogue' ? activeDialogueProfile.audioDurationSecs : activeSample.audioDurationSecs;
  }, [arenaMode, activeSample, activeDialogueProfile]);

  const activeClipEnd = useMemo(() => {
    return clipEnd !== null ? clipEnd : totalDuration;
  }, [clipEnd, totalDuration]);

  // Reset clipping when active sample or mode changes
  useEffect(() => {
    setClipStart(0);
    setClipEnd(null);
  }, [activeSampleId, activeDialogueProfileId, arenaMode]);

  // Timer for Microphone Recording simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDurSec(prev => {
          if (prev >= 20) { // Limit to 20 seconds mock
            setIsRecording(false);
            return prev;
          }
          return prev + 1;
        });
        setRecordingPeaks(prev => [...prev, Math.random() * 0.8 + 0.1]);
      }, 1000);
    } else {
      setRecordingDurSec(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const recognitionRef = useRef<any>(null);

  // Custom live audio trigger
  const startMicRecording = () => {
    setIsRecording(true);
    setRecordingPeaks([0.3, 0.5]);
    setMicSampleTranscript("Listening in real-time... Speak now.");
    setActiveSampleId('custom-mic');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'id-ID'; // default to Indonesian as it is highly popular on our platform
        
        let finalTrans = '';
        rec.onresult = (event: any) => {
          let interimTrans = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTrans += event.results[i][0].transcript;
            } else {
              interimTrans += event.results[i][0].transcript;
            }
          }
          const combined = finalTrans || interimTrans;
          if (combined) {
            setMicSampleTranscript(combined);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("SpeechRecognition socket error or blocked permissions: ", e.error);
        };

        rec.onend = () => {
          console.log("SpeechRecognition native listener complete.");
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.error("SpeechRecognition initialization crashed:", err);
      }
    }
  };

  const stopMicRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to cleanly stop SpeechRecognition:", e);
      }
      recognitionRef.current = null;
    }
    
    // Fallback if no audio was captured or SpeechRecognition is not supported/blank
    setTimeout(() => {
      setMicSampleTranscript(prev => {
        if (!prev || prev === "Listening in real-time... Speak now." || prev.trim().length === 0) {
          return "Gue lagi nyobain input suara langsung nih di browser, pengen tau sesangar apa model local whisper.cpp dibanding ElevenLabs cloud.";
        }
        return prev;
      });
    }, 100);
  };

  const handleEditActiveDialogue = () => {
    setIsEditingDialogue(true);
  };

  const handleCreateCustomDialogue = () => {
    const newId = `custom_dialogue_${Date.now()}`;
    const cleanPrefix = activeDialogueProfile.name.replace(/^[^\s]+\s+/, '');
    const newProfile = {
      id: newId,
      name: `➕ Custom ${cleanPrefix || 'Dialogue'}`,
      language: activeDialogueProfile.language,
      difficulty: activeDialogueProfile.difficulty,
      description: `User-defined test dialogue based on ${activeDialogueProfile.name}`,
      audioDurationSecs: activeDialogueProfile.audioDurationSecs,
      turns: activeDialogueProfile.turns.map(t => ({ ...t })),
      hasOverlays: activeDialogueProfile.hasOverlays,
      isCustom: true
    };
    
    const updated = [...dialogueProfiles, newProfile];
    setDialogueProfiles(updated);
    localStorage.setItem('stt_custom_dialogue_profiles', JSON.stringify(updated));
    setActiveDialogueProfileId(newId);
    setIsEditingDialogue(true);
    setCompletedBattle(false);
  };

  const handleDeleteDialogue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = dialogueProfiles.filter(p => p.id !== id);
    setDialogueProfiles(updated);
    localStorage.setItem('stt_custom_dialogue_profiles', JSON.stringify(updated));
    
    if (activeDialogueProfileId === id) {
      const remainingStandard = updated.find(p => !p.isCustom);
      setActiveDialogueProfileId(remainingStandard ? remainingStandard.id : 'customer_support_telco');
    }
    setIsEditingDialogue(false);
    setCompletedBattle(false);
  };

  const handleSaveDialogueProfile = (savedProfile: any) => {
    const updated = dialogueProfiles.map(p => p.id === savedProfile.id ? savedProfile : p);
    setDialogueProfiles(updated);
    localStorage.setItem('stt_custom_dialogue_profiles', JSON.stringify(updated));
    setIsEditingDialogue(false);
    setCompletedBattle(false);
  };

  // Helper to trigger Battle simulation
  const startArenaBattle = () => {
    if (isArenaProcessing) return;
    setIsArenaProcessing(true);
    setCompletedBattle(false);
    setArenaProgress(0);
    setArenaLogs([]);
    setCpuLoad(0);
    setGpuLoad(0);
    setCpuHistory([]);
    setGpuHistory([]);
    setRealtimeTextA('');
    setRealtimeTextB('');
    setDetectedEmotionA(null);
    setDetectedEmotionB(null);
    setApiWarning(null);

    const isDialogue = arenaMode === 'dialogue';
    const activeDuration = isDialogue ? activeDialogueProfile.audioDurationSecs : activeSample.audioDurationSecs;
    
    const isModelABrowser = arenaModelA.startsWith('browser-') || modelAObj.sourceType.includes('Browser');
    const isModelBBrowser = arenaModelB.startsWith('browser-') || modelBObj.sourceType.includes('Browser');
    const hasActiveBrowserModel = isModelABrowser || isModelBBrowser;

    const isModelAWasm = arenaModelA.startsWith('browser-') && arenaModelA !== 'browser-web-speech-api';
    const isModelBWasm = arenaModelB.startsWith('browser-') && arenaModelB !== 'browser-web-speech-api';
    const isWasmActive = isModelAWasm || isModelBWasm;

    const isModelANative = arenaModelA === 'browser-web-speech-api';
    const isModelBNative = arenaModelB === 'browser-web-speech-api';
    const isNativeActive = isModelANative || isModelBNative;
    
    // Calculate transcript limited to the clipped segment
    let fullTranscript = '';
    if (isDialogue) {
      fullTranscript = activeDialogueProfile.turns
        .filter(t => t.end >= clipStart && t.start <= activeClipEnd)
        .map(t => t.text)
        .join(' ');
    } else {
      const wordsList = activeSample.transcript.split(/\s+/).filter(Boolean);
      const wordDur = activeSample.audioDurationSecs / wordsList.length;
      fullTranscript = wordsList
        .filter((_, idx) => {
          const start = idx * wordDur;
          const end = start + wordDur;
          return end >= clipStart && start <= activeClipEnd;
        })
        .join(' ');
    }
    const words = fullTranscript.split(' ');

    // Dynamic Client-Side Speech Recognition & WASM Runner (Phase 3 & Phase 4)
    const runTranscription = (modelId: string, modelObj: STTModel) => {
      const isBrowser = modelId.startsWith('browser-') || modelObj.sourceType.includes('Browser');
      const isNative = modelObj.sourceType.includes('Native');
      
      if (isBrowser) {
        return new Promise((resolve) => {
          const downloadSize = (modelObj as any).downloadSizeMb || 0;
          const startTime = performance.now();
          
          const runnerUpdate = (msg: string) => {
            setArenaLogs(prev => [...prev, msg]);
          };

          // Run the matching real runner or offline simulator
          let runPromise: Promise<string>;
          if (modelId === 'browser-web-speech-api') {
            const requestedLang = isDialogue 
              ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel') ? 'Indonesian' : 'English') 
              : activeSample.language;
            runPromise = runWebSpeechApi(requestedLang, micSampleTranscript || null, runnerUpdate);
          } else if (modelId === 'browser-transformers-js') {
            const requestedLang = isDialogue 
              ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel') ? 'Indonesian' : 'English') 
              : activeSample.language;
            runPromise = runTransformersJs(modelObj.name, requestedLang, runnerUpdate);
          } else if (modelId.startsWith('browser-whisper-cpp')) {
            runPromise = runWhisperCppWasm(modelObj.name, downloadSize, runnerUpdate);
          } else {
            runPromise = runOfflineSimulator(modelId, modelObj.name, runnerUpdate);
          }

          runPromise.then(() => {
            const endTime = performance.now();
            const totalLat = Math.round(endTime - startTime);

            const simulatedText = generateWordMumbles(
              fullTranscript, 
              modelObj, 
              isDialogue ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel')) : activeSample.language === 'Indonesian'
            );
            
            const mockWords = simulatedText.split(/\s+/).filter(Boolean);
            const segmentsList = [{
              start: clipStart,
              end: activeClipEnd,
              text: simulatedText,
              speakerId: 0,
              words: mockWords.map((word, wIdx) => ({
                word,
                start: parseFloat((clipStart + wIdx * 0.4).toFixed(2)),
                end: parseFloat((clipStart + wIdx * 0.4 + 0.3).toFixed(2)),
                probability: parseFloat((0.88 + Math.random() * 0.12).toFixed(3))
              }))
            }];

            resolve({
              text: simulatedText,
              language: isDialogue ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel') ? 'Indonesian' : 'English') : activeSample.language,
              detectedEmotion: modelObj.emotionDetection ? 'Neutral (In-Browser)' : null,
              latency_ms: totalLat,
              model: modelObj.name,
              segments: segmentsList,
              isBrowserWasm: !isNative,
              downloadSizeMb: downloadSize,
              isBrowserSTT: true
            });
          });
        });
      } else {
        return fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            text: fullTranscript,
            language: requestLanguage,
            isMumbled: requestIsMumbled,
            temperature: 0.2
          })
        }).then(r => r.json());
      }
    };
    
    // Step by step logs
    const logTimeline = isDialogue ? [
      { p: 5, msg: `🤖 Initializing Dialogue mode battle: Model A (${modelAObj.name}) vs Model B (${modelBObj.name})` },
      { p: 15, msg: `📦 Allocating host RAM & VRAM: [A] requires ${modelAObj.vramRequiredGb}GB | [B] requires ${modelBObj.vramRequiredGb}GB` },
      { p: 30, msg: `⚡ Mounting Model Engines: [A] ${modelAObj.sourceType} loaded | [B] ${modelBObj.sourceType} loaded` },
      { p: 45, msg: `🎙️ Processing Multi-speaker VAD (Voice Activity Detection): Detected ${activeDialogueProfile.audioDurationSecs}s conversational context` },
      { p: 60, msg: `👥 Commencing diarization clustering & alignment algorithms...` },
      { p: 75, msg: `📝 Mapping sub-second overlaps & timestamps indices` },
      { p: 90, msg: `📊 Aligned speech turns reconciled. Calculating speaker-turn and WER statistics...` },
      { p: 100, msg: `✅ Diarization processing finished successfully.` }
    ] : [
      { p: 5, msg: `🤖 Initializing battle challenge: Model A (${modelAObj.name}) vs Model B (${modelBObj.name})` },
      { p: 15, msg: `📦 Allocating host RAM & VRAM: [A] requires ${modelAObj.vramRequiredGb}GB | [B] requires ${modelBObj.vramRequiredGb}GB` },
      { p: 30, msg: `⚡ Mounting Model Engines: [A] ${modelAObj.sourceType} loaded | [B] ${modelBObj.sourceType} loaded` },
      { p: 45, msg: `🎙️ Processing VAD (Voice Activity Detection): Detected ${activeSample.audioDurationSecs}s audio context` },
      { p: 60, msg: `🧠 Commencing model decoding beam searches...` },
      { p: 75, msg: `📝 Computing alignments and dynamic timestamps` },
      { p: 90, msg: `📊 Word alignments reconciled. Calculating latency benchmarks and statistics...` },
      { p: 100, msg: `✅ Processing finished successfully.` }
    ];

    // Fire actual Express full-stack API or dynamic Client/WASM requests Concurrently
    let apiCompleted = false;
    let apiResultA: any = null;
    let apiResultB: any = null;

    const requestLanguage = isDialogue 
      ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel') ? 'Indonesian' : 'English') 
      : activeSample.language;
    const requestIsMumbled = isDialogue 
      ? activeDialogueProfile.difficulty === 'Hard' 
      : activeSample.mumbled;

    Promise.all([
      runTranscription(arenaModelA, modelAObj),
      runTranscription(arenaModelB, modelBObj)
    ]).then(([resA, resB]) => {
      apiResultA = resA;
      apiResultB = resB;
      apiCompleted = true;
    }).catch(err => {
      console.error("ASR Gateway run error (using local mumble fallback):", err);
      apiCompleted = true; // Fallback to client-side generators gracefully
    });

    let currentLogIndex = 0;
    const intervalTicks = 50; // fast ticker
    let currentPct = 0;
    let fallbackWarningLogged = false;
    let resourceTickCount = 0;
    const localCpuHistory: number[] = [];
    const localGpuHistory: number[] = [];

    const timer = setInterval(() => {
      // Resource simulation
      if (hasActiveBrowserModel) {
        resourceTickCount++;
        if (resourceTickCount % 2 === 0) {
          let targetCpu = 0;
          let targetGpu = 0;
          if (isWasmActive) {
            targetCpu = Math.floor(70 + Math.random() * 25); // 70-95
            targetGpu = Math.floor(1 + Math.random() * 5);   // 1-5
          } else if (isNativeActive) {
            targetCpu = Math.floor(15 + Math.random() * 16); // 15-30
            targetGpu = Math.floor(Math.random() * 2);       // 0-1
          }

          localCpuHistory.push(targetCpu);
          localGpuHistory.push(targetGpu);
          if (localCpuHistory.length > 20) localCpuHistory.shift();
          if (localGpuHistory.length > 20) localGpuHistory.shift();

          setCpuLoad(targetCpu);
          setGpuLoad(targetGpu);
          setCpuHistory([...localCpuHistory]);
          setGpuHistory([...localGpuHistory]);

          // Every 16 ticks (approx 800ms) append a telemetry status message inside the Arena CLI panel
          if (resourceTickCount % 16 === 0) {
            const cpuSpark = generateSparkline(localCpuHistory, 100);
            const gpuSpark = generateSparkline(localGpuHistory, 100);
            setArenaLogs(prev => [
              ...prev,
              `[Resource Engine] Usage: CPU ${targetCpu}% [${cpuSpark || ' '}] | GPU ${targetGpu}% [${gpuSpark || ' '}]`
            ]);
          }
        }
      }

      currentPct += 1.5;
      if (currentPct >= 100) {
        if (!apiCompleted) {
          // Hold animation progress at 99% until backend responds 
          currentPct = 99;
          setArenaProgress(99);
          if (!fallbackWarningLogged) {
            setArenaLogs(prev => [...prev, `[ASR GATEWAY] Awaiting real response coordinates...`]);
            fallbackWarningLogged = true;
          }
          return;
        }
        
        currentPct = 100;
        clearInterval(timer);
        setIsArenaProcessing(false);
        setCompletedBattle(true);
        
        // Final backend/fallback outcomes
        const fallbackA = generateWordMumbles(fullTranscript, modelAObj, isDialogue ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel')) : activeSample.language === 'Indonesian');
        const fallbackB = generateWordMumbles(fullTranscript, modelBObj, isDialogue ? (activeDialogueProfile.id.includes('telco') || activeDialogueProfile.id.includes('jaksel')) : activeSample.language === 'Indonesian');

        const finalTextA = (apiResultA && apiResultA.text) ? apiResultA.text : fallbackA;
        const finalTextB = (apiResultB && apiResultB.text) ? apiResultB.text : fallbackB;

        setRealtimeTextA(finalTextA);
        setRealtimeTextB(finalTextB);

        // Latencies
        setActualLatencyA(apiResultA?.latency_ms || modelAObj.latencyMs);
        setActualLatencyB(apiResultB?.latency_ms || modelBObj.latencyMs);

        // Emotion Detection
        const emotionA = (apiResultA && apiResultA.detectedEmotion) || (modelAObj.emotionDetection ? 'Neutral / Conversational' : null);
        const emotionB = (apiResultB && apiResultB.detectedEmotion) || (modelBObj.emotionDetection ? 'Neutral / Curious 🎤' : null);
        setDetectedEmotionA(emotionA);
        setDetectedEmotionB(emotionB);

        // Warnings from proxy fallback
        if (apiResultA?.fallbackWarning || apiResultB?.fallbackWarning) {
          setApiWarning(apiResultA?.fallbackWarning || apiResultB?.fallbackWarning);
        }
      }

      setArenaProgress(Math.floor(currentPct));

      // Append log checks
      if (currentLogIndex < logTimeline.length && currentPct >= logTimeline[currentLogIndex].p) {
        setArenaLogs(prev => [...prev, `[${(currentPct * 0.05).toFixed(1)}s] ${logTimeline[currentLogIndex].msg}`]);
        currentLogIndex++;
      }

      // Stream words progressively
      const wordCountToReveal = Math.floor((currentPct / 100) * words.length);
      const textSoFar = words.slice(0, wordCountToReveal).join(' ');
      if (currentPct < 98) {
        setRealtimeTextA(textSoFar);
        setRealtimeTextB(textSoFar);
      }
    }, intervalTicks);
  };

  // Helper mock parser to simulate model speech decoding flaws (WER simulation)
  const generateWordMumbles = (transcript: string, model: STTModel, isIndoSample: boolean) => {
    // Determine the modeled error probability on this sample
    let errorRate = model.werEnglish;
    if (isIndoSample) {
      errorRate = model.werIndonesian;
    }
    if (activeSample.mumbled) {
      errorRate = Math.max(errorRate, model.werMumbled);
    }
    
    // Whisper fails on Indo support if wer is 99 (mock unsupported)
    if (isIndoSample && !model.indonesianSupport) {
      return "[UNSUPPORTED LANGUAGE] " + transcript.split(' ').map(() => "???").slice(0, 10).join(' ') + " (Mismatched weights/invalid token vocabulary)";
    }

    const words = transcript.split(' ');
    const output = words.map((w, index) => {
      // Simulate specialized error rates
      const randomSeed = Math.random() * 100;
      if (randomSeed < errorRate) {
        // Types of speech transcription misses
        if (randomSeed < errorRate * 0.3) {
          // Synonym/Phonetic misinterpretation
          if (w.toLowerCase() === 'faster-whisper') return 'fast-whispering';
          if (w.toLowerCase() === 'cahya') return 'saya';
          if (w.toLowerCase() === 'websocket') return 'soket web';
          if (w.toLowerCase() === 'jakarta') return 'karata';
          if (w.toLowerCase() === 'transcribe') return 'scribble';
          return w.substring(0, Math.max(2, w.length - 2)) + '...';
        } else if (randomSeed < errorRate * 0.6) {
          // Missing word
          return '____';
        } else {
          // Double word or casing issue
          return w.toLowerCase();
        }
      }
      return w;
    });

    return output.join(' ');
  };


  // ================= CLOUD SAAS VS LOCAL GPU CALCULATOR =================
  const [monthlyHours, setMonthlyHours] = useState<number>(1000);
  const [gpuType, setGpuType] = useState<'A10G' | 'T4' | 'A100'>('A10G');

  // Local Cluster costs estimation
  const clusterEstimation = useMemo(() => {
    // 1 hour of audio is 60 minutes = 3600 seconds.
    // At average throughput words per second, let's see how much audio a single GPU node can process.
    // Average 10-second audio takes about 0.2 seconds to process on A10G (50x real-time speed in specialized models).
    // Let's use a standard estimate: Real-Time Factor (RTF).
    // Let's say we have an RTF of 0.05 (1 hour of audio takes 3 minutes on 1 GPU node).
    // Max volume a single GPU node running 24/7 can handle:
    // 720 hours in a month. At RTF 0.05, that single GPU can process 720 / 0.05 = 14,400 hours of audio per month.
    // So Nodes Required = Ceil(monthlyHours / 14400)
    const gpuCapacityHoursPerMonth = 720 * 20; // 1 GPU node can handle 14,400 hours of audio processing non-stop 
    const nodesRequired = Math.max(1, Math.ceil(monthlyHours / gpuCapacityHoursPerMonth));

    // Rates
    const gpuHourlyRate = gpuType === 'T4' ? 0.35 : gpuType === 'A10G' ? 1.00 : 3.50;
    const monthlyNodeHardwareCost = nodesRequired * (gpuHourlyRate * 730); // Multiplied by hours in month
    
    // Add developer/maintenance base ops overhead
    const opsDevSalaryCost = 500; // tiny slice of local dev operational maintenance
    const cloudEgressAndCpuCosts = nodesRequired * 80; // network cost

    const totalLocalMonthlyCost = monthlyNodeHardwareCost + opsDevSalaryCost + cloudEgressAndCpuCosts;
    const localCostPerMillionWords = (totalLocalMonthlyCost / (monthlyHours * 9000)) * 1000000; // estimated 9000 words per hour

    return {
      nodesRequired,
      monthlyNodeHardwareCost: Math.round(monthlyNodeHardwareCost),
      opsDevSalaryCost,
      networkCost: Math.round(cloudEgressAndCpuCosts),
      totalCost: Math.round(totalLocalMonthlyCost),
      costPerMillionWords: parseFloat(localCostPerMillionWords.toFixed(2))
    };
  }, [monthlyHours, gpuType]);

  // Cloud Providers calculated costs for the active monthly hours
  // 1 hour of audio corresponds to ~9,000 words.
  const wordCountInMillions = useMemo(() => {
    return (monthlyHours * 9000) / 1000000;
  }, [monthlyHours]);

  const cloudCostsOutput = useMemo(() => {
    return CLOUD_ALTERNATIVES.map(c => {
      const totalCost = c.costPerMillionWords * wordCountInMillions;
      return {
        ...c,
        calculatedMonthlyCost: Math.round(totalCost)
      };
    });
  }, [wordCountInMillions]);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeTab(id);
    setTimeout(() => setCopiedCodeTab(null), 2500);
  };

  // Recharts Scatter data formatting: Accuracy % vs Cloud Cost VS Latency
  const scatterPlotData = useMemo(() => {
    const data: any[] = [];
    // Add cloud alternatives
    CLOUD_ALTERNATIVES.forEach(c => {
      data.push({
        name: c.name,
        wer: c.accuracyWer,
        cost: c.costPerMillionWords,
        latency: c.avgLatencyMs,
        type: 'Cloud SaaS',
        vram: 0,
      });
    });

    // Add selected TOP local models
    CANDIDATE_MODELS.slice(0, 12).forEach(m => {
      // Approximate local cost is based on simulated scale. Let's make a fair estimate: e.g. self-managed A10G is $0.5 - $3 per million words
      const estimatedLocalCost = (m.vramRequiredGb < 3) ? 1.20 : (m.vramRequiredGb < 8) ? 3.50 : 8.00;
      data.push({
        name: m.name,
        wer: m.werEnglish,
        cost: estimatedLocalCost,
        latency: m.latencyMs,
        type: 'Local Open Source',
        vram: m.vramRequiredGb,
      });
    });
    return data;
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-800 font-sans selection:bg-slate-200 selection:text-slate-900 transition-colors duration-200">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md text-white flex items-center justify-center">
              <svg className="w-5.5 h-5.5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" id="panel-logo">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h1 className="font-display font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5 flex-wrap">
                  Speech-to-Text Model Arena
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase leading-none">v2.4.0-BETA</span>
                  {apiConfig && (
                    <span 
                      className={`border text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase leading-none flex items-center gap-1 cursor-help transition-all ${
                        apiConfig.mode === 'live'
                          ? 'bg-amber-50 border-amber-250 text-amber-700 hover:bg-amber-100/50'
                          : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-150'
                      }`}
                      title={apiConfig.mode === 'live' ? `ASR Gateway is LIVE, proxying to real local server: ${apiConfig.realUrl}` : 'ASR Gateway is in MOCKUP mode, returning high-fidelity simulations.'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${apiConfig.mode === 'live' ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'}`} />
                      ASR Gateway: {apiConfig.mode}
                    </span>
                  )}
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1">SOTA ASR BENCHMARKING & OPTIMIZATION</p>
              </div>
              
              {/* Telemetry Stats in Header - Desktop Only */}
              <div className="hidden lg:flex items-center space-x-5 border-l border-slate-200 pl-5 h-8">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Total Engines</p>
                  <p className="text-xs font-extrabold text-slate-700 leading-none mt-1">{calculatedLeaderboard.length} MODELS</p>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Global Average WER</p>
                  <p className="text-xs font-extrabold text-emerald-600 leading-none mt-1">5.12%</p>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Active Hardware</p>
                  <p className="text-xs font-extrabold text-slate-700 leading-none mt-1">A100 Tensor Core</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation Segmented Control */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/50 flex gap-1 w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('gpu'); }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex-1 md:flex-initial cursor-pointer ${
                activeTab === 'gpu' 
                  ? 'bg-white text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>GPU Cluster</span>
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex-1 md:flex-initial cursor-pointer ${
                activeTab === 'leaderboard' 
                  ? 'bg-white text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => { setActiveTab('arena'); }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex-1 md:flex-initial cursor-pointer ${
                activeTab === 'arena' 
                  ? 'bg-white text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Comparative Arena</span>
            </button>
            <button
              onClick={() => { setActiveTab('cloud'); }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex-1 md:flex-initial cursor-pointer ${
                activeTab === 'cloud' 
                  ? 'bg-white text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Cloud vs Local Costs</span>
            </button>
            <button
              onClick={() => { setActiveTab('docs'); }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex-1 md:flex-initial cursor-pointer ${
                activeTab === 'docs' 
                  ? 'bg-white text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>API Deployment</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE FRAME FOR BENTO DASHBOARD */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* TOP INTERACTIVE CONTROL CENTER (SLIDERS WEIGHTING) */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-6 items-stretch">
          <div className="md:w-1/3 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                <h2 className="font-display font-semibold text-slate-900 text-sm tracking-wide uppercase">Interactive Scoring Weight</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reposition the sliders to match your operational requirements. The <b>Custom Score</b> for all 27 models recalculated in real-time, modifying the leaderboard rankings immediately!
              </p>
              <WeightPresets currentWeights={weights} onPresetSelect={setWeights} />
            </div>
            
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">Dynamic Algorithm Node</span>
              <button 
                onClick={resetWeights}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to balanced</span>
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {/* Slider 1: Accuracy */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  🎯 Transcription Accuracy (WER)
                </span>
                <span className="font-mono text-indigo-600 font-semibold">{weights.accuracy}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.accuracy}
                onChange={(e) => setWeights({ ...weights, accuracy: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Heavily penalizes higher word error rates on both clear and mumbled audio.</p>
            </div>

            {/* Slider 2: Latency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  ⚡ Processing Latency (RTF)
                </span>
                <span className="font-mono text-indigo-600 font-semibold">{weights.latency}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.latency}
                onChange={(e) => setWeights({ ...weights, latency: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Favors lightweight setups optimized for real-time streaming (&lt;200ms latency).</p>
            </div>

            {/* Slider 3: Indonesian Support */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  🇮🇩 Indonesian Language Priority
                </span>
                <span className="font-mono text-indigo-600 font-semibold">{weights.indonesian}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.indonesian}
                onChange={(e) => setWeights({ ...weights, indonesian: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Boosts specialized models with exceptional vocabularies for Indonesian Dialects.</p>
            </div>

            {/* Slider 4: Resource Efficiency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  💾 Hardware Resource Economy
                </span>
                <span className="font-mono text-indigo-600 font-semibold">{weights.resource}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.resource}
                onChange={(e) => setWeights({ ...weights, resource: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Strongly favors low VRAM footprint models viable on CPU or budget clouds.</p>
            </div>
          </div>
        </section>

        {/* TAB CONTROLLERS & PANEL OUTPUTS */}
        <AnimatePresence mode="wait">

          {/* TAB 0: GPU MODEL ORCHESTRATION */}
          {activeTab === 'gpu' && (
            <motion.div
              key="gpu-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <GpuModelManager />
            </motion.div>
          )}
          
          {/* TAB 1: LEADERBOARD INDEX */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Filter controls panel */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  
                  {/* Search and Core Filter Category */}
                  <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input 
                        type="search" 
                        placeholder="Search model name or backend framework (e.g. whisper, cahya)..." 
                        className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs whitespace-nowrap flex items-center gap-1 font-medium">
                        <ListFilter className="w-3.5 h-3.5" /> Engine:
                      </span>
                      <select 
                        value={filterSourceType}
                        onChange={(e) => setFilterSourceType(e.target.value)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="All">All Source Types</option>
                        <option value="Local">Local Implementations</option>
                        <option value="HuggingFace">HuggingFace Hub</option>
                        <option value="Cloud">Commercial Cloud APIs</option>
                      </select>

                      <select 
                        value={selectedLicense}
                        onChange={(e) => setSelectedLicense(e.target.value)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="All">All Licenses</option>
                        <option value="MIT">MIT</option>
                        <option value="Apache-2.0">Apache-2.0</option>
                        <option value="CC-BY-NC-4.0">CC-BY-NC-4.0</option>
                        <option value="Research-Only">Research-Only</option>
                        <option value="Proprietary">Proprietary</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                    <span>Showing <b>{filteredLeaderboard.length}</b> of <b>{calculatedLeaderboard.length}</b> total engines</span>
                  </div>
                </div>

                {/* Multilingual and Capability Quick Toggles */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-500 mr-2">Filter Capacities:</span>
                  
                  <button 
                    onClick={() => setFilterMultilingual(!filterMultilingual)}
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-150 ${
                      filterMultilingual 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    🌎 Multilingual
                  </button>

                  <button 
                    onClick={() => setFilterIndonesian(!filterIndonesian)}
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-150 ${
                      filterIndonesian 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    🇮🇩 Indonesian Support
                  </button>

                  <button 
                    onClick={() => setFilterEmotion(!filterEmotion)}
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-150 ${
                      filterEmotion 
                        ? 'bg-pink-50 border-pink-200 text-pink-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    🗣️ Emotion Detection
                  </button>

                  <button 
                    onClick={() => setFilterMumbling(!filterMumbling)}
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-150 ${
                      filterMumbling 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    🌫️ Mumbling Robustness
                  </button>

                  <button 
                    onClick={() => setFilterIndoSpecific(!filterIndoSpecific)}
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-150 ${
                      filterIndoSpecific 
                        ? 'bg-teal-50 border-teal-200 text-teal-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    🎯 Indonesia Specific Model
                  </button>
                  
                  {(filterMultilingual || filterIndonesian || filterEmotion || filterMumbling || filterIndoSpecific || searchQuery || filterSourceType !== 'All' || selectedLicense !== 'All') && (
                    <button 
                      onClick={() => {
                        setFilterMultilingual(false);
                        setFilterIndonesian(false);
                        setFilterEmotion(false);
                        setFilterMumbling(false);
                        setFilterIndoSpecific(false);
                        setSearchQuery('');
                        setFilterSourceType('All');
                        setSelectedLicense('All');
                      }}
                      className="text-slate-400 hover:text-slate-700 underline text-[11px] font-sans ml-auto"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>

              {/* 2D BENCHMARK SCATTER/BUBBLE RELATION MATRIX */}
              <LeaderboardScatterChart 
                data={filteredLeaderboard} 
                pinnedModelIds={pinnedModelIds} 
                onPinModel={handlePinModel} 
                onHoverModel={setHoveredModel}
              />

              {/* LEADERBOARD TABLE BODY & HOVERING DETAIL PANEL */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Table containing the models */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                          <th className="py-3 px-4 text-center font-semibold w-14">Rank</th>
                          <th className="py-3 px-4 font-semibold">Model Name & ID</th>
                          <th className="py-3 px-4 font-semibold text-center">API / Source</th>
                          <th className="py-3 px-4 font-semibold text-center">Clean WER (EN)</th>
                          <th className="py-3 px-4 font-semibold text-center">ID WER</th>
                          <th className="py-3 px-4 font-semibold text-center">Latency</th>
                          <th className="py-3 px-4 font-semibold text-center">Core Caps</th>
                          <th className="py-3 px-4 text-right pr-5 font-semibold">Custom Score</th>
                          <th className="py-3 px-4 text-center font-semibold w-24">Fast Compare</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredLeaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400 bg-slate-50/20 font-sans">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-semibold text-slate-600">No matching candidate engines found.</p>
                              <p className="text-xs text-slate-400 mt-0.5">Try easing your feature checklists or clearing your search term.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredLeaderboard.map((model, idx) => {
                            // Find matching layout inside initial models list to determine original index 
                            const originalRank = CANDIDATE_MODELS.findIndex(m => m.id === model.id) + 1;
                            
                            return (
                              <tr 
                                key={model.id}
                                onMouseEnter={() => setHoveredModel(model)}
                                onMouseLeave={() => setHoveredModel(null)}
                                className="hover:bg-slate-50/70 transition-colors cursor-help duration-150"
                              >
                                {/* Rank */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center">
                                    {idx + 1 === 1 ? (
                                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[11px] border border-amber-200">🥇 1</span>
                                    ) : idx + 1 === 2 ? (
                                      <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-md text-[11px] border border-slate-300">🥈 2</span>
                                    ) : idx + 1 === 3 ? (
                                      <span className="bg-orange-100 text-orange-850 font-bold px-2 py-0.5 rounded-md text-[11px] border border-orange-200">🥉 3</span>
                                    ) : (
                                      <span className="text-slate-550 font-mono font-semibold">{idx + 1}</span>
                                    )}
                                  </div>
                                </td>

                                {/* Name & ID */}
                                <td className="py-3.5 px-4 font-sans">
                                  <div>
                                    <span className="font-semibold text-slate-900 group-hover:text-indigo-600 block">{model.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400">ID: {model.id}</span>
                                  </div>
                                </td>

                                {/* Method / Source */}
                                <td className="py-3.5 px-4 text-center font-sans">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono border ${
                                    model.sourceType === 'HuggingFace' 
                                      ? 'bg-yellow-50 text-yellow-850 border-yellow-200/60' 
                                      : model.sourceType === 'Cloud SaaS API'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60 font-bold'
                                        : 'bg-indigo-50 text-indigo-800 border-indigo-200/50'
                                  }`}>
                                    {model.sourceType.replace('Local / ', '')}
                                  </span>
                                </td>

                                {/* English WER */}
                                <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                                  {model.werEnglish.toFixed(1)}%
                                </td>

                                {/* ID WER */}
                                <td className="py-3.5 px-4 text-center font-mono">
                                  {model.werIndonesian === 99 ? (
                                    <span className="text-rose-450 hover:text-rose-600" title="No official support, output unusable">❌ Unsupported</span>
                                  ) : (
                                    <span className="font-semibold text-teal-650">{model.werIndonesian.toFixed(1)}%</span>
                                  )}
                                </td>

                                {/* Latency */}
                                <td className="py-3.5 px-4 text-center font-mono">
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-slate-705">{model.latencyMs} ms</span>
                                    <span className="text-[9px] text-slate-400">RTF: {(model.latencyMs / 1000).toFixed(3)}</span>
                                  </div>
                                </td>

                                {/* Capabilities Symbols */}
                                <td className="py-3.5 px-4 text-center font-sans">
                                  <div className="flex items-center justify-center gap-1">
                                    {model.multilingual && <span title="Multilingual" className="text-xs">🌎</span>}
                                    {model.indonesianSupport && <span title="Indonesian Supported" className="text-xs">🇮🇩</span>}
                                    {model.emotionDetection && <span title="Emotion Detection" className="text-xs">🗣️</span>}
                                    {model.mumblingRobustness && <span title="Robust to mumbling" className="text-xs">🌫️</span>}
                                    {model.indonesiaSpecific && <span title="Optimized specialized for Indonesia" className="text-xs">🎯</span>}
                                  </div>
                                </td>

                                {/* Custom Score bar and indicator */}
                                <td className="py-3.5 px-4 text-right pr-5 font-mono">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="hidden sm:block w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className="bg-indigo-600 h-full rounded-full" 
                                        style={{ width: `${model.customScore}%` }}
                                      />
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">{model.customScore}</span>
                                  </div>
                                </td>

                                {/* Fast Compare Action Column */}
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePinModel(model.id);
                                    }}
                                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all inline-flex items-center gap-1 cursor-pointer ${
                                      pinnedModelIds.includes(model.id)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
                                    }`}
                                    title={pinnedModelIds.includes(model.id) ? 'Remove from Compare Matrix' : 'Pin to Compare Matrix'}
                                  >
                                    <Scale className="w-3.5 h-3.5" />
                                    <span>{pinnedModelIds.includes(model.id) ? 'Pinned' : 'Compare'}</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 py-3.5 px-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Info className="w-4 h-4 text-indigo-500" /> Hover any row to view full hardware requirements, throughput speeds, and open license parameters.</span>
                    <span className="font-mono text-[10px]">Rank based on {weights.accuracy}-{weights.latency}-{weights.indonesian}-{weights.resource} weights</span>
                  </div>
                </div>

                {/* Info pane that shows details of hovered or selected model */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono uppercase tracking-wide">
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Model Spec Sheet Explorer</span>
                    </div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm mt-1 uppercase">
                      {hoveredModel ? hoveredModel.name : "Hover a STT Model row"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans">
                      {hoveredModel 
                        ? `A highly powerful ${hoveredModel.sourceType} speech architecture.` 
                        : "Hover on any STT engine in the leaderboard table adjacent to display deep model specifications."
                      }
                    </p>
                  </div>

                  {hoveredModel ? (
                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <div className="flex justify-between text-slate-550 mb-0.5 text-[11px]">Memory / Scaling Footprint:</div>
                        <div className="font-mono text-slate-900 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span>{hoveredModel.isCloud ? "Cloud Managed (Serverless)" : `~ ${hoveredModel.vramRequiredGb.toFixed(1)} GB VRAM`}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            hoveredModel.isCloud 
                              ? 'bg-emerald-50 text-emerald-700'
                              : hoveredModel.vramRequiredGb < 2 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : hoveredModel.vramRequiredGb < 8 
                                  ? 'bg-indigo-50 text-indigo-700' 
                                  : 'bg-red-50 text-red-700'
                          }`}>
                            {hoveredModel.isCloud ? 'Auto-Scales' : hoveredModel.vramRequiredGb < 2 ? 'Edge Viable' : hoveredModel.vramRequiredGb < 8 ? 'Server GPU' : 'A100 Required'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-550 mb-0.5 text-[11px]">Execution Environment / SLA:</div>
                        <div className="font-mono text-slate-900 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span>{hoveredModel.isCloud ? `SaaS Managed (${hoveredModel.company})` : `Local Host - Status: ${hoveredModel.cpuViability}`}</span>
                          <span className="text-xs">
                            {hoveredModel.isCloud ? '☁️' : hoveredModel.cpuViability === 'Excellent' ? '⚡' : hoveredModel.cpuViability === 'Good' ? '✅' : '⚠️'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-550 mb-0.5 text-[11px]">Estimated Peak Throughput:</div>
                        <div className="font-mono text-slate-900 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-150 flex justify-between">
                          <span>{hoveredModel.throughputWordsPerSec} Words / Sec</span>
                          <span className="text-slate-400">{(hoveredModel.throughputWordsPerSec / 150).toFixed(1)}x rt</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-555 mb-0.5 text-[11px] font-medium">{hoveredModel.isCloud ? "Usage Cost Base:" : "License Parameters:"}</div>
                        <div className="font-mono text-slate-900 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                          <span>{hoveredModel.isCloud ? `$${hoveredModel.costPerMillionWords.toFixed(2)} per M words` : hoveredModel.license}</span>
                          <span className={`text-[10px] font-semibold px-2 rounded-full ${
                            hoveredModel.isCloud
                              ? 'bg-indigo-50 text-indigo-800'
                              : ['MIT', 'Apache-2.0'].includes(String(hoveredModel.license))
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                          }`}>
                            {hoveredModel.isCloud ? 'Pay-per-use' : ['MIT', 'Apache-2.0'].includes(String(hoveredModel.license)) ? 'Commercial Ok' : 'Restrictions'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-indigo-100/30 text-[11px] text-slate-600 space-y-1">
                        <div className="font-semibold text-indigo-950 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Model Summary
                        </div>
                        <p className="leading-normal">
                          {hoveredModel.isCloud
                            ? `Commercial APIs offered by ${hoveredModel.company}. Features include complete serverless reliability, ${hoveredModel.accuracyWer}% global WER on clean profiles, and dynamic multi-language workflows.`
                            : (hoveredModel.indonesianSupport && hoveredModel.indonesiaSpecific 
                              ? "Engine specifically tuned or fine-tuned to capture native Southeast Asian accents, slang, and dialect nuances perfectly."
                              : hoveredModel.indonesianSupport 
                                ? "General-purpose multilingual model with robust support for official Indonesian vocabulary."
                                : "This engine does not carry vocabulary tokens for Indonesian. Running Indonesian audio through this will yield garbage predictions.")
                          }
                        </p>
                      </div>

                      {!hoveredModel.isCloud && (
                        <button 
                          onClick={() => {
                            setArenaModelA(hoveredModel.id);
                            setActiveTab('arena');
                          }}
                          className="w-full mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center font-medium shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Battle with this in Arena</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <LayoutGrid className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                      <p className="text-[11px]">Hover over rows in the database grid to explore deep technical features, licenses, and throughput values.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: COMPARATIVE ARENA PLAYGROUND */}
          {activeTab === 'arena' && (
            <motion.div
              key="arena-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Arena Configuration Left Control Side */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <SlidersHorizontal className="w-4.5 h-4.5 text-indigo-600" />
                      Configure Arena Match
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Select your models and input source sample to run comparative alignment evaluation.</p>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/60 flex gap-1">
                    <button
                      onClick={() => { setArenaMode('single'); setCompletedBattle(false); }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-center transition-all cursor-pointer ${
                        arenaMode === 'single'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🗣️ Single Voice
                    </button>
                    <button
                      onClick={() => { setArenaMode('dialogue'); setCompletedBattle(false); }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-center transition-all cursor-pointer ${
                        arenaMode === 'dialogue'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👥 Dialogue Mode
                    </button>
                  </div>

                  {/* Model Selections */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                        <span>🛡️ Engine Model A</span>
                        <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold">First Fighter</span>
                      </label>
                      <select 
                        value={arenaModelA}
                        onChange={(e) => setArenaModelA(e.target.value)}
                        className="w-full py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      >
                        {(Object.entries(groupedFighters) as [string, STTModel[]][]).map(([familyName, modelsList]) => (
                          <optgroup key={familyName} label={familyName}>
                            {modelsList.map(m => {
                              const active = isModelActive(m.id);
                              return (
                                <option 
                                  key={m.id} 
                                  value={m.id} 
                                  disabled={!active}
                                >
                                  {m.name} ({m.sourceType.replace('Local / ', '')}) {!active ? ' (STBY / UNLOADED)' : ''}
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                        <span>⚔️ Engine Model B</span>
                        <span className="text-[10px] font-mono text-amber-600 uppercase font-bold">Second Fighter</span>
                      </label>
                      <select 
                        value={arenaModelB}
                        disabled={arenaModelA === arenaModelB}
                        onChange={(e) => setArenaModelB(e.target.value)}
                        className="w-full py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:bg-slate-100"
                      >
                        {(Object.entries(groupedFighters) as [string, STTModel[]][]).map(([familyName, modelsList]) => (
                          <optgroup key={familyName} label={familyName}>
                            {modelsList.map(m => {
                              const active = isModelActive(m.id);
                              const disabledByA = m.id === arenaModelA;
                              return (
                                <option 
                                  key={m.id} 
                                  value={m.id} 
                                  disabled={disabledByA || !active}
                                >
                                  {m.name} ({m.sourceType.replace('Local / ', '')}) {disabledByA ? ' (FIGHTER A)' : !active ? ' (STBY / UNLOADED)' : ''}
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                      {arenaModelA === arenaModelB && (
                        <p className="text-[10px] text-amber-600 mt-1">Please select different models for comparative alignment.</p>
                      )}
                    </div>
                  </div>

                  {/* Audio source selections */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        {arenaMode === 'dialogue' ? '👥 Select Call Center / Chat Dialogue' : '🎙️ Select Target Audio Frame'}
                      </label>
                      {arenaMode === 'dialogue' && (
                        <button
                          onClick={handleCreateCustomDialogue}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md"
                          title="Create a new custom dialogue by cloning the active one"
                        >
                          ➕ Create New
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {arenaMode === 'dialogue' ? (
                        <>
                          {dialogueProfiles.map(profile => (
                            <button
                              key={profile.id}
                              onClick={() => { setActiveDialogueProfileId(profile.id); setCompletedBattle(false); }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer group ${
                                activeDialogueProfileId === profile.id
                                  ? 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-sm font-semibold'
                                  : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-650'
                              }`}
                            >
                              <span className="text-base leading-none pt-0.5">
                                {profile.language.includes('English') ? '🇬🇧' : '🇮🇩'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold flex items-center justify-between text-[11px] gap-1">
                                  <span className="truncate">{profile.name}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className={`text-[8px] px-1 py-0.2 rounded-full font-mono uppercase ${
                                      profile.difficulty === 'Easy' 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : profile.difficulty === 'Medium'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}>
                                      {profile.difficulty}
                                    </span>
                                    {profile.isCustom && (
                                      <span
                                        onClick={(e) => handleDeleteDialogue(profile.id, e)}
                                        className="p-0.5 text-slate-400 hover:text-red-650 rounded hover:bg-slate-200/60 cursor-pointer inline-flex items-center"
                                        title="Delete custom dialogue preset"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-450 truncate mt-0.5">{profile.description}</p>
                              </div>
                            </button>
                          ))}
                          
                          {/* Dialogue Builder Overlay / Toggle Button */}
                          <button
                            onClick={handleEditActiveDialogue}
                            className={`w-full py-2 px-3 rounded-lg border border-dashed text-xs text-center font-medium transition-all ${
                              isEditingDialogue
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-s'
                                : 'border-indigo-200 hover:border-indigo-300 text-indigo-600 bg-indigo-50/10 hover:bg-indigo-50/30'
                            } flex items-center justify-center gap-1.5 cursor-pointer mt-1`}
                          >
                            <span>✏️ Turn-by-Turn Dialogue Builder</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {AUDIO_SAMPLES.map(sample => (
                            <button
                              key={sample.id}
                              onClick={() => { setActiveSampleId(sample.id); setCompletedBattle(false); }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                                activeSampleId === sample.id
                                  ? 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-sm'
                                  : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-650'
                              }`}
                            >
                              <span className="text-base leading-none">
                                {sample.language === 'English' ? '🇬🇧' : '🇮🇩'}
                              </span>
                              <div className="flex-1">
                                <div className="font-semibold flex items-center justify-between text-[11px]">
                                  <span>{sample.name}</span>
                                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono uppercase ${
                                    sample.difficulty === 'Easy' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : sample.difficulty === 'Medium'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {sample.difficulty}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-450 line-clamp-1 mt-0.5">{sample.description}</p>
                              </div>
                            </button>
                          ))}

                          {/* Microphone Recording Simulation Option */}
                          <div className="pt-2">
                            {!isRecording ? (
                              <button
                                onClick={startMicRecording}
                                className={`w-full py-2 px-3 rounded-lg border border-dashed text-xs text-center font-medium transition-all ${
                                  activeSampleId === 'custom-mic'
                                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                                    : 'border-slate-300 hover:border-slate-400 text-slate-600 bg-slate-50/50 hover:bg-slate-100/50'
                                } flex items-center justify-center gap-2 cursor-pointer`}
                              >
                                <Mic className="w-3.5 h-3.5 text-rose-500" />
                                <span>Simulate custom voice speaking</span>
                              </button>
                            ) : (
                              <div className="border border-rose-200 p-2.5 rounded-xl bg-rose-50 text-center animate-pulse space-y-1">
                                <div className="flex items-center justify-center gap-2 font-semibold text-rose-800 text-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                                  <span>Recording: {recordingDurSec}s / 20s Max</span>
                                </div>
                                <p className="text-[10px] text-slate-500">Speak your custom sentence context natively.</p>
                                <button
                                  onClick={stopMicRecording}
                                  className="mt-2 py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white font-medium text-[10px] rounded cursor-pointer"
                                >
                                  Stop & Finalize Audio context
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Custom Uploader & URL paste target */}
                          <div className="pt-2">
                            <CustomAudioUploader
                              activeSampleId={activeSampleId}
                              onSampleLoaded={(sample) => {
                                setCustomUploadedSample(sample);
                                setActiveSampleId('custom-audio');
                                setCompletedBattle(false);
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Battle CTA */}
                  <button
                    disabled={isArenaProcessing || isRecording || arenaModelA === arenaModelB}
                    onClick={startArenaBattle}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-300 text-white font-semibold rounded-xl text-center shadow-lg transition-all text-xs flex items-center justify-center gap-2 tracking-wide uppercase cursor-pointer"
                  >
                    <Play className="w-4.5 h-4.5 text-emerald-400 fill-emerald-400" />
                    <span>{isArenaProcessing ? 'Processing Arena Benchmarks...' : '⚡ Initiate Model Arena Battle'}</span>
                  </button>
                </div>

                {/* Right Interactive Battle Arena Screen */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* Waveform Visualization Component card */}
                  <AudioSlicerWaveform
                    mode={arenaMode}
                    activeSample={activeSample}
                    activeProfile={activeDialogueProfile}
                    progress={arenaProgress}
                    setProgress={setArenaProgress}
                    isArenaProcessing={isArenaProcessing}
                    clipStart={clipStart}
                    clipEnd={activeClipEnd}
                    onClipChange={(start, end) => {
                      setClipStart(start);
                      setClipEnd(end);
                    }}
                  />

                  {/* LIVE COMPILATION LOGS (IF PROCESSING) */}
                  {isArenaProcessing && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm font-mono text-[10px] text-emerald-400 space-y-2 h-44 overflow-y-auto">
                      <div className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-1.5 mb-2 font-sans">
                        <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-emerald-400" /> CLI Simulation Console</span>
                        <span>{arenaProgress}%</span>
                      </div>

                      {/* Real-time telemetry sparklines */}
                      {hasActiveBrowserModel && (
                        <div className="flex flex-col md:flex-row gap-3 px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg font-mono text-[9px] text-slate-300 mb-2.5 select-none text-left">
                          <div className="flex items-center gap-1.5 flex-1 justify-between md:justify-start">
                            <span className="text-emerald-400 font-bold uppercase tracking-wider font-sans">CPU:</span>
                            <span className="font-semibold text-white w-8 text-right">{cpuLoad}%</span>
                            <span className="text-emerald-500 tracking-normal text-xs leading-none bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/40 font-mono whitespace-nowrap">
                              {generateSparkline(cpuHistory, 100) || ' '}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 justify-between md:justify-start">
                            <span className="text-amber-400 font-bold uppercase tracking-wider font-sans">GPU:</span>
                            <span className="font-semibold text-white w-8 text-right">{gpuLoad}%</span>
                            <span className="text-amber-500 tracking-normal text-xs leading-none bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900/40 font-mono whitespace-nowrap">
                              {generateSparkline(gpuHistory, 100) || ' '}
                            </span>
                          </div>
                        </div>
                      )}

                      {arenaLogs.map((log, i) => (
                        <div key={i} className="leading-relaxed animate-[fadeIn_0.2s_ease-out] text-left">
                          {log}
                        </div>
                      ))}
                      <div className="animate-pulse text-indigo-400 leading-normal text-left">
                        ⚡ decoding frames synchronously at {(modelAObj.throughputWordsPerSec * 1.5).toFixed(0)} WpS...
                      </div>
                    </div>
                  )}

                  {/* SIDE BY SIDE OUTCOMES CARD */}
                  {arenaMode === 'dialogue' ? (
                    isEditingDialogue ? (
                      <DialogueBuilder
                        initialProfile={activeDialogueProfile}
                        onSave={handleSaveDialogueProfile}
                        onClose={() => setIsEditingDialogue(false)}
                      />
                    ) : (
                      <DialogueArena
                        modelA={modelAObj}
                        modelB={modelBObj}
                        profile={activeDialogueProfile}
                        progress={arenaProgress}
                        isProcessing={isArenaProcessing}
                        isCompleted={completedBattle}
                        clipStart={clipStart}
                        clipEnd={activeClipEnd}
                      />
                    )
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* MODEL A PANEL */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm space-y-3.5">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">MODEL A</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <h4 className="font-display font-bold text-slate-900 text-sm">{modelAObj.name}</h4>
                              {(arenaModelA.startsWith('browser-') || modelAObj.sourceType.includes('Browser')) && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-mono font-bold px-1 py-0.5 rounded uppercase whitespace-nowrap">
                                  In-Browser WASM
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono tracking-tight capitalize">
                              {modelAObj.sourceType}
                              {modelAObj.downloadSizeMb ? ` • ${modelAObj.downloadSizeMb}MB Binary` : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-400">WER ENG/ID</div>
                            <div className="text-sm font-bold text-slate-800">{modelAObj.werEnglish.toFixed(1)}% / {modelAObj.werIndonesian === 99 ? 'N/A' : `${modelAObj.werIndonesian.toFixed(1)}%`}</div>
                          </div>
                        </div>

                        {/* Transcribed Output Box */}
                        <div className={`p-3 rounded-xl border min-h-[90px] text-xs leading-normal transition-all font-sans ${
                          completedBattle ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 italic'
                        }`}>
                          {completedBattle ? (
                            renderDiffText(activeSample.transcript, realtimeTextA)
                          ) : isArenaProcessing ? (
                            <div className="space-y-1.5 animate-pulse">
                              <span className="text-[10px] font-mono text-indigo-500">Decoding stream data...</span>
                              <p className="text-slate-500">{realtimeTextA || '...'}</p>
                            </div>
                          ) : (
                            "Initiate comparative battle above to reveal decoded text predictions."
                          )}
                        </div>

                        {/* Model A Specs Cards */}
                        {completedBattle && (
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">Latency (10s):</span>
                              <span className="font-mono font-bold text-slate-850">
                                {actualLatencyA !== null ? `${actualLatencyA} ms` : `${modelAObj.latencyMs} ms`}
                                {actualLatencyA !== null && (arenaModelA.startsWith('browser-') || modelAObj.sourceType.includes('Browser')) && (
                                  <span className="text-[8px] block text-amber-700 font-sans font-medium">(CPU Run + Comp)</span>
                                )}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">Throughput:</span>
                              <span className="font-mono font-bold text-slate-850">
                                {arenaModelA.startsWith('browser-') 
                                  ? `${Math.round(modelAObj.throughputWordsPerSec * 0.9)} WpS (JS)` 
                                  : `${modelAObj.throughputWordsPerSec} WpS`}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">Estimated WER:</span>
                              <span className="font-mono font-bold text-slate-850">{calculateWerMetric(activeSample.transcript, realtimeTextA)}%</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">VRAM allocated:</span>
                              <span className="font-mono font-bold text-slate-850">
                                {arenaModelA.startsWith('browser-') || modelAObj.sourceType.includes('Browser') ? "0.0 GB (RAM)" : `${modelAObj.vramRequiredGb.toFixed(1)} GB`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* MODEL B PANEL */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm space-y-3.5">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="bg-amber-55 bg-amber-50 text-amber-700 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">MODEL B</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <h4 className="font-display font-bold text-slate-900 text-sm">{modelBObj.name}</h4>
                              {(arenaModelB.startsWith('browser-') || modelBObj.sourceType.includes('Browser')) && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-mono font-bold px-1 py-0.5 rounded uppercase whitespace-nowrap">
                                  In-Browser WASM
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono tracking-tight capitalize">
                              {modelBObj.sourceType}
                              {modelBObj.downloadSizeMb ? ` • ${modelBObj.downloadSizeMb}MB Binary` : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-400">WER ENG/ID</div>
                            <div className="text-sm font-bold text-slate-800">{modelBObj.werEnglish.toFixed(1)}% / {modelBObj.werIndonesian === 99 ? 'N/A' : `${modelBObj.werIndonesian.toFixed(1)}%`}</div>
                          </div>
                        </div>

                        {/* Transcribed Output Box */}
                        <div className={`p-3 rounded-xl border min-h-[90px] text-xs leading-normal transition-all font-sans ${
                          completedBattle ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 italic'
                        }`}>
                          {completedBattle ? (
                            renderDiffText(activeSample.transcript, realtimeTextB)
                          ) : isArenaProcessing ? (
                            <div className="space-y-1.5 animate-pulse">
                              <span className="text-[10px] font-mono text-amber-500">Decoding stream data...</span>
                              <p className="text-slate-500">{realtimeTextB || '...'}</p>
                            </div>
                          ) : (
                            "Initiate comparative battle above to reveal decoded text predictions."
                          )}
                        </div>

                        {/* Model B Specs Cards */}
                        {completedBattle && (
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">Latency (10s):</span>
                              <span className="font-mono font-bold text-slate-850">
                                {actualLatencyB !== null ? `${actualLatencyB} ms` : `${modelBObj.latencyMs} ms`}
                                {actualLatencyB !== null && (arenaModelB.startsWith('browser-') || modelBObj.sourceType.includes('Browser')) && (
                                  <span className="text-[8px] block text-amber-700 font-sans font-medium">(CPU Run + Comp)</span>
                                )}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">Throughput:</span>
                              <span className="font-mono font-bold text-slate-850">
                                {arenaModelB.startsWith('browser-') 
                                  ? `${Math.round(modelBObj.throughputWordsPerSec * 0.9)} WpS (JS)` 
                                  : `${modelBObj.throughputWordsPerSec} WpS`}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">Estimated WER:</span>
                              <span className="font-mono font-bold text-slate-850">{calculateWerMetric(activeSample.transcript, realtimeTextB)}%</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">VRAM allocated:</span>
                              <span className="font-mono font-bold text-slate-850">
                                {arenaModelB.startsWith('browser-') || modelBObj.sourceType.includes('Browser') ? "0.0 GB (RAM)" : `${modelBObj.vramRequiredGb.toFixed(1)} GB`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* VERDICT CARD */}
                  {completedBattle && (
                    <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs animate-[fadeIn_0.3s_ease-out]">
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Alignment Reconciliation Complete</span>
                        </div>
                        <p className="text-slate-500 max-w-lg">
                          {arenaMode === 'dialogue' ? (
                            <>
                              Model <b>{(actualLatencyA !== null ? actualLatencyA : modelAObj.latencyMs) < (actualLatencyB !== null ? actualLatencyB : modelBObj.latencyMs) ? modelAObj.name : modelBObj.name}</b> completes speech decoding fastest. 
                              Model <b>{modelAObj.hasSpeakerDiarization ? modelAObj.name : modelBObj.name}</b> successfully isolates sub-second conversational overlaps and establishes pristine diarization alignment.
                            </>
                          ) : (
                            <>
                              Model <b>{(actualLatencyA !== null ? actualLatencyA : modelAObj.latencyMs) < (actualLatencyB !== null ? actualLatencyB : modelBObj.latencyMs) ? modelAObj.name : modelBObj.name}</b> wins on processing latency. 
                              Model <b>{getBetterAccuracyModel(modelAObj, modelBObj, activeSample)}</b> provides superior transcription accuracy on this specific difficulty footprint.
                            </>
                          )}
                        </p>
                      </div>

                      <button 
                        onClick={startArenaBattle} 
                        className="py-1.5 px-3 border border-slate-200 hover:border-slate-350 bg-white rounded-lg font-medium shadow-xs transition-all flex items-center gap-1 whitespace-nowrap text-slate-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Re-run test
                      </button>
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: CLOUD SAAS VS LOCAL GPU TOTAL COST OF OWNERSHIP (TCO) */}
          {activeTab === 'cloud' && (
            <motion.div
              key="cloud-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              <ComparativeAnalysisReport />

              {/* Financial Dashboard controls */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Scale className="w-4.5 h-4.5 text-indigo-500" />
                    Operational Expenditure vs Capital Expenditure (OpEx vs CapEx)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Determine at which audio volume threshold self-hosted local open-source Whisper clusters become highly profitable compared to Cloud SaaS APIs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-slate-105">
                  
                  {/* Slider Control */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">🎧 Monthly Target Volume Hours:</span>
                        <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {monthlyHours.toLocaleString()} Hours / Month
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="20000" 
                        step="100"
                        value={monthlyHours}
                        onChange={(e) => setMonthlyHours(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>100 Hours (Startup)</span>
                        <span>5,000 Hours (Mid Enterprise)</span>
                        <span>20,000 Hours (Large Call Center)</span>
                      </div>
                    </div>

                    {/* VRAM / GPU selection */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">🖥️ Local GPU Hardware Tier Target:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setGpuType('T4')}
                          className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                            gpuType === 'T4'
                              ? 'bg-indigo-50 border-indigo-300 text-slate-900 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-650'
                          }`}
                        >
                          <div className="font-bold text-slate-800">NVIDIA T4 GPU</div>
                          <p className="text-[10px] text-slate-450 mt-0.5">16GB VRAM | Budget viable | ~$0.35/hr</p>
                        </button>

                        <button
                          onClick={() => setGpuType('A10G')}
                          className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                            gpuType === 'A10G'
                              ? 'bg-indigo-50 border-indigo-300 text-slate-900 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-650'
                          }`}
                        >
                          <div className="font-bold text-slate-800">NVIDIA A10G</div>
                          <p className="text-[10px] text-slate-450 mt-0.5">24GB VRAM | Standard | ~$1.00/hr</p>
                        </button>

                        <button
                          onClick={() => setGpuType('A100')}
                          className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                            gpuType === 'A100'
                              ? 'bg-indigo-50 border-indigo-300 text-slate-900 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-650'
                          }`}
                        >
                          <div className="font-bold text-slate-800">NVIDIA A100</div>
                          <p className="text-[10px] text-slate-450 mt-0.5">80GB VRAM | Heavy LLM | ~$3.50/hr</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary card metrics */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-wider block">Local Server Formula Verdict</span>
                      <div className="text-2xl font-bold font-display text-slate-900 mt-1">
                        ${clusterEstimation.totalCost.toLocaleString()} <span className="text-xs text-slate-450 font-sans font-normal">/ month</span>
                      </div>
                      <p className="text-[11px] text-slate-505 leading-relaxed mt-1.5">
                        Exposes local ctranslate2 whisper clusters. Requires <b>{clusterEstimation.nodesRequired}</b> concurrent active instances processing {activeSample.audioDurationSecs}s segments.
                      </p>
                    </div>

                    <div className="border-t border-slate-200/50 pt-2 text-[10px] text-slate-400 space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span>Node Compute:</span>
                        <span className="text-slate-700">${clusterEstimation.monthlyNodeHardwareCost}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ops Oversight allocation:</span>
                        <span className="text-slate-700">${clusterEstimation.opsDevSalaryCost}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Local Cost per M words:</span>
                        <span className="text-slate-700 font-bold">${clusterEstimation.costPerMillionWords.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <TcoLineChart 
                currentMonthlyHours={monthlyHours} 
                gpuType={gpuType} 
                clusterCostPerMonth={clusterEstimation.totalCost} 
              />

              {/* CLOUD SERVICES STAKEHOLDER COMPARISON MATRIX */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                      Key Cloud STT Services: Enterprise Stakeholder Comparison Matrix
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">A detailed audit of commercial Speech-to-Text market leaders on pricing tiers, latency profiles, model training/vocab customization, and overall accuracy.</p>
                  </div>
                  <div className="bg-indigo-50 text-indigo-700 font-sans font-medium text-[10px] uppercase px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1 self-start md:self-center">
                    <span>💡 Local Cost Base: ${clusterEstimation.costPerMillionWords.toFixed(2)} per M words</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4 font-semibold">Service Provider</th>
                        <th className="py-3 px-4 font-semibold">Cost Structure</th>
                        <th className="py-3 px-4 font-semibold">Typical Latency</th>
                        <th className="py-3 px-4 font-semibold">Model Customization Options</th>
                        <th className="py-3 px-4 font-semibold">General Accuracy Profile</th>
                        <th className="py-3 px-4 font-semibold text-right pr-4">Stakeholder Fit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">Google Cloud Speech-to-Text (V2)</div>
                          <span className="text-[10px] text-slate-400 font-medium">Google Cloud (Vertex/Chirp)</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono leading-normal">
                          <div className="font-semibold text-slate-800">$0.024 / Min</div>
                          <div className="text-[10.5px] text-slate-500">~$1.44 per hour. Enterprise volume discount tiers available under subscription.</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-100">80 - 110 ms</span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono">Highly optimized streaming</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <ul className="list-disc pl-3 text-slate-600 text-[11px] space-y-0.5">
                            <li>Phrase Boosting & Word-Level Hints</li>
                            <li>Dynamic Class Tokens (Dates, Numbers)</li>
                            <li>Custom Acoustic Model adaptation</li>
                          </ul>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-emerald-600 font-mono">95.2% Accuracy (4.8% WER)</div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">Outstanding coverage for formal, informal Indonesian & accented regional speech.</p>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-4">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-100">Conversational Streams</span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">Amazon Transcribe</div>
                          <span className="text-[10px] text-slate-400 font-medium">Amazon Web Services (AWS)</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono leading-normal">
                          <div className="font-semibold text-slate-800">$0.024 / Min</div>
                          <div className="text-[10.5px] text-slate-500">~$1.44 per hour. Low volume tier price decreases; includes AWS S3/PII redaction integration.</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded font-semibold border border-slate-200">120 - 150 ms</span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono">Standard HTTP/2 streams</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <ul className="list-disc pl-3 text-slate-600 text-[11px] space-y-0.5">
                            <li>Custom vocabularies & word lists</li>
                            <li>Vocabulary filtering (profanity masking)</li>
                            <li>Custom Language Models (CLMs)</li>
                          </ul>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700 font-mono">94.8% Accuracy (5.2% WER)</div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">Superb formal dialogue formatting. Local dialects require specific vocab profiles.</p>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-4">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-250">AWS Cloud S3 Chains</span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">Deepgram Nova-2</div>
                          <span className="text-[10px] text-slate-400 font-medium">Deepgram Developer Platform</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono leading-normal">
                          <div className="font-semibold text-emerald-600">$0.0043 / Min</div>
                          <div className="text-[10.5px] text-slate-500">~$0.26 per hour. Up to 5x cheaper than legacy clouds. Broadest scalability discount curves.</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-100">50 - 70 ms</span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono">Ultra-low streaming latency</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <ul className="list-disc pl-3 text-slate-600 text-[11px] space-y-0.5">
                            <li>Instant Keyword Boosting weights</li>
                            <li>Dynamic search-and-replace list filters</li>
                            <li>Fully custom custom model training</li>
                          </ul>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700 font-mono">95.1% Accuracy (4.9% WER)</div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">Incredible speed & punctuation. Highly robust on mumbled fast support terms.</p>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-4">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-150">Voice AI Agents</span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">OpenAI Whisper API</div>
                          <span className="text-[10px] text-slate-400 font-medium">OpenAI Developer Platform</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono leading-normal">
                          <div className="font-semibold text-slate-800">$0.006 / Min</div>
                          <div className="text-[10.5px] text-slate-500">~$0.36 per hour. Fixed pay-on-usage rate; no tiered discounts available.</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-amber-100">200 - 300 ms</span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono">No live stream (Files only)</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <ul className="list-disc pl-3 text-slate-600 text-[11px] space-y-0.5">
                            <li>Text prompt guides (guiding style/terms)</li>
                            <li>No vocabulary adaptation options</li>
                            <li>No acoustic fine-tuning features</li>
                          </ul>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-indigo-600 font-mono">95.4% Accuracy (4.6% WER)</div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">Industry-benchmark spelling formatting. Easily auto-filters filler speech.</p>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-4">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-100">Batch Transcripts</span>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* TWO COLUMN COMPARISONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visual Chart showing scatter analytics of WER vs Cost */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3.5">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm">Efficiency Chart: Cost vs Accuracy Spectrum</h4>
                    <p className="text-xs text-slate-500">Visualization highlighting the exact balance point. Ideal candidates are located in the bottom-left corner (Lowest WER & Lowest hourly cost equivalent).</p>
                  </div>

                  {/* Interactive Recharts container */}
                  <div className="h-[260px] w-full pt-2 font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          type="number" 
                          dataKey="wer" 
                          name="Word Error Rate (WER) %" 
                          unit="%" 
                          domain={[2, 16]} 
                        />
                        <YAxis 
                          type="number" 
                          dataKey="cost" 
                          name="Cost per M Words" 
                          unit=" USD" 
                          domain={[0, 26]} 
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter name="Cloud SaaS Providers" data={scatterPlotData.filter(d => d.type === 'Cloud SaaS')} fill="#ef4444" shape="rect" />
                        <Scatter name="Local Self-Hosted (A10G)" data={scatterPlotData.filter(d => d.type === 'Local Open Source')} fill="#4f46e5" shape="circle" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Direct price matrix comparing Cloud Providers */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm">Cloud Competitor Monthly Projection Analytics</h4>
                    <p className="text-xs text-slate-500">A direct lookup comparing what commercial platforms would bill for the identical <b>{wordCountInMillions.toFixed(1)}M words ({monthlyHours.toLocaleString()} Hours)</b>.</p>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {cloudCostsOutput.map(c => {
                      const exceedsLocal = c.calculatedMonthlyCost > clusterEstimation.totalCost;
                      return (
                        <div key={c.id} className="py-2 flex items-center justify-between font-sans">
                          <div>
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{c.company} | ${c.costPerMillionWords.toFixed(2)} per million words</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">${c.calculatedMonthlyCost.toLocaleString()}</span>
                            <span className={`text-[9px] font-semibold px-1 rounded uppercase ${
                              exceedsLocal ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {exceedsLocal 
                                ? `(${((c.calculatedMonthlyCost / clusterEstimation.totalCost) * 100 - 100).toFixed(0)}% pricier than local cluster)`
                                : `(${((1 - c.calculatedMonthlyCost / clusterEstimation.totalCost) * 100).toFixed(0)}% cheaper)`
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-450 leading-normal bg-amber-50/50 p-2 rounded-lg border border-amber-100/30">
                    💡 <b>Capital Break-Even Alert:</b> Self-hosted Whisper architecture is highly economical if monthly volume exceeds <b>1,400 Hours</b>. Over this threshold, Deepgram & GCP V2 API costs quickly surpass local GPU deployment fees.
                  </div>
                </div>

              </div>

              {/* ARCHITECTURAL RECOMMENDATIONS SECTION */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                  Target Use Case Architectures & Best Recommendations
                </h3>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
                  
                  {/* Real-time Customer Support */}
                  <div className="space-y-3 border-r border-slate-100 pr-4 md:pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                      Real-Time Customer Support
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Exacting environments where latency dominates. Requires immediate feedback loops for conversational agents, speech synthesis triggers, or active screen guidance.
                    </p>
                    <ul className="space-y-2 text-slate-650 leading-relaxed text-[11px]">
                      <li><b>⚡ Target Latency:</b> Under 150ms first-byte stream feedback.</li>
                      <li><b>🎁 Best Open-Source:</b> <code>whisper.cpp</code> or <code>faster-whisper</code> running on INT8 quantization via WebSockets.</li>
                      <li><b>☁️ Best Commercial Cloud:</b> <code>Deepgram Nova-2</code> (50-70ms) or <code>Google Cloud STT (V2)</code> streaming protocols.</li>
                      <li><b>🛠️ Core Feature Scope:</b> Focuses on rapid audio frame chunking, streaming Voice Activity Detection (VAD) to ignore breath/silence, and low latency streaming APIs.</li>
                    </ul>
                  </div>

                  {/* Offline Enterprise Analytics */}
                  <div className="space-y-3 border-r border-slate-100 pr-4 md:pr-2">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                      Offline Enterprise Analytics
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Post-call analysis where accuracy is crucial. Supports automated billing audits, compliance tracking, and agent performance reviews.
                    </p>
                    <ul className="space-y-2 text-slate-650 leading-relaxed text-[11px]">
                      <li><b>🎯 Target Latency:</b> Unbound (Asynchronous batch runner pipelines).</li>
                      <li><b>🎁 Best Open-Source:</b> <code>Whisper Large-V3</code> paired with <code>pyannote.audio</code> for elite local speaker diarization.</li>
                      <li><b>☁️ Best Commercial Cloud:</b> <code>AssemblyAI Best-Tier</code> (integrated sentiment + topics) or <code>Google Cloud STT V2 Batch</code> with complete speaker diarization.</li>
                      <li><b>🚀 Secondary Capabilities:</b> Prioritizes high noise cancellation, dialect transcription, emotion detection, and automatic chapter summaries.</li>
                    </ul>
                  </div>

                  {/* Voice-Assisted Regional Services */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm" />
                      Regional (ID/Indonesian) Applications
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Localized deployments requiring dialect-aware vocabulary mapping for local terms, Javanese/Sundanese mixtures, and fast-talking informal speech.
                    </p>
                    <ul className="space-y-2 text-slate-650 leading-relaxed text-[11px]">
                      <li><b>🇮🇩 Target Latency:</b> Moderate (under 400ms).</li>
                      <li><b>🎁 Best Open-Source:</b> <code>cahya/faster-whisper-medium-id</code> or <code>indonesian-nlp/wav2vec2-indonesian-javanese-sundanese</code>.</li>
                      <li><b>☁️ Best Commercial Cloud:</b> <code>Google Cloud STT V2</code> (exceptional Indonesian & regional accent mapping).</li>
                      <li><b>📌 Core Design Choice:</b> Run localized HuggingFace tokenizers with custom vocabulary boosts to correctly capture native and slang expressions.</li>
                    </ul>
                  </div>

                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: DEVELOPER DOCUMENTATION & API GUIDES */}
          {activeTab === 'docs' && (
            <motion.div
              key="docs-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* Top intro */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-display font-semibold text-slate-900 text-sm">Developer Implementation & Installation Guide</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                  Quickly deploy your chosen local open-source speech models using high-performance CTranslate2 bindings, C++ compiler stacks, or Hugging Face. Ensure seamless integration through a robust, well-documented API.
                </p>
              </div>

              <ApiPayloadGenerator />

              <ApiSandbox />

              {/* CODE TABS CONTROLLER CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column left - Setup manuals */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* Setup Block 1: Faster-Whisper */}
                  <div className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
                    <div className="bg-slate-950 py-3 px-4.5 border-b border-emerald-500/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Terminal className="text-emerald-400 w-4 h-4" />
                        <span className="font-mono text-xs font-semibold text-emerald-400">FASTER-WHISPER / Python Service</span>
                      </div>
                      <button 
                        onClick={() => handleCopyCode('fw', fwPythonCode)}
                        className="p-1 px-2.5 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-400 transition-all flex items-center gap-1.5 border border-slate-850"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCodeTab === 'fw' ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        Faster-whisper executes transcription weights up to **4x faster** than original PyTorch models using CTranslate2 optimization layers.
                      </p>
                      <pre className="p-3 bg-slate-950/60 rounded-xl overflow-x-auto text-[10px] font-mono text-slate-200 border border-slate-850 leading-relaxed">
                        {fwPythonCode}
                      </pre>
                    </div>
                  </div>

                  {/* Setup Block 2: Whisper.cpp (C++) */}
                  <div className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
                    <div className="bg-slate-950 py-3 px-4.5 border-b border-indigo-500/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Cpu className="text-indigo-400 w-4 h-4" />
                        <span className="font-mono text-xs font-semibold text-indigo-400">WHISPER.CPP / C++ Native Binary Compilation</span>
                      </div>
                      <button 
                        onClick={() => handleCopyCode('cpp', cppCode)}
                        className="p-1 px-2.5 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-400 transition-all flex items-center gap-1.5 border border-slate-850"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCodeTab === 'cpp' ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        Whisper.cpp compiles directly into native CPU code with zero dependencies. Runs perfectly on isolated resource-restricted systems or edge configurations.
                      </p>
                      <pre className="p-3 bg-slate-950/60 rounded-xl overflow-x-auto text-[10px] font-mono text-slate-200 border border-slate-850 leading-relaxed">
                        {cppCode}
                      </pre>
                    </div>
                  </div>

                </div>

                {/* Column right - API definitions */}
                <div className="space-y-5">
                  
                  {/* Setup Block 3: REST API endpoint schemas */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h4 className="font-display font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-emerald-500" />
                        JSON API Request Schema
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Expose Whisper results through standard HTTP REST pipelines for fast clients.</p>
                    </div>

                    <div className="space-y-3 text-xs font-sans">
                      <div>
                        <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200 uppercase mr-1">POST</span>
                        <code className="text-slate-800 font-mono font-semibold text-[11px]">/api/v1/transcribe</code>
                      </div>

                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-700">
                        <div className="font-semibold text-slate-600 border-b border-slate-200 pb-0.5 mb-1 text-[9px] uppercase tracking-wide">Multi-Part Form Data</div>
                        <div className="flex justify-between">
                          <span>file:</span>
                          <span className="text-slate-500 font-sans italic">Raw WAV or MP3 audio file</span>
                        </div>
                        <div className="flex justify-between">
                          <span>model:</span>
                          <span className="text-indigo-650 font-sans italic font-bold">"faster-whisper-medium-id"</span>
                        </div>
                        <div className="flex justify-between">
                          <span>language:</span>
                          <span className="text-slate-500 font-sans italic">"id" (Optional)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>word_timestamps:</span>
                          <span className="text-slate-500 font-sans italic">true</span>
                        </div>
                      </div>

                      {/* API Response schema snippet */}
                      <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed">
{`{
  "status": "success",
  "meta": {
    "engine": "faster-whisper",
    "compute_ms": 195
  },
  "segments": [
    {
      "start": 0.0,
      "end": 2.1,
      "text": "jujurly kita tuh kayak",
      "words": [
        {"word": "jujurly", "start": 0.0, "end": 0.6, "prob": 0.99},
        {"word": "kita", "start": 0.6, "end": 1.1, "prob": 0.98}
      ]
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Integration Complexity Analysis */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 font-sans text-xs">
                    <h4 className="font-display font-semibold text-slate-905 text-xs uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-4 h-4 text-purple-500" />
                      Integration Complexity Matrix
                    </h4>
                    
                    <div className="space-y-3 leading-relaxed">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                          <span>Local Self-Hosted Frameworks</span>
                          <span className="text-amber-700">Medium-High</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Takes initial DevOps planning to load CUDA containers and setup load-balancers. However, it completely avoids recurring SaaS audio rate licensing and provides 100% HIPAA/Privacy compliance.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                          <span>Cloud Managed APIs</span>
                          <span className="text-emerald-700">Low</span>
                        </div>
                        <p className="text-[10px] text-slate-505">
                          Extremely low setup cost. Integrated with a single developer token. Highly reliable but subject to network latency overheads, data compliance constraints, and expensive high-volume margins.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
              
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 pb-24 text-center text-xs text-slate-450 font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-600">Sensing Arena • Speech-To-Text Model Benchmark Project</p>
          <p>Designed and Compiled for Stakeholders & Developers making Data-Driven Architectural Solutions.</p>
        </div>
      </footer>

      {/* Compare Dock component floating at the bottom */}
      <CompareDock 
        pinnedModels={pinnedModels}
        onUnpin={handleUnpin}
        onClearAll={handleClearAllPinned}
        onLaunchArena={handleLaunchArena}
      />

    </div>
  );
}

// ================= CODE SNIPPETS FOR DOCUMENTATION TAB =================
const fwPythonCode = `# Install: pip install faster-whisper
from faster_whisper import WhisperModel

# Use cuda model / int8 configuration to speed translation up on local GPU
model_size = "cahya/faster-whisper-medium-id"
model = WhisperModel(model_size, device="cuda", compute_type="float16")

# Transcribe an audio segment with specialized indonesian configurations
segments, info = model.transcribe(
    "audio_sample.wav", 
    beam_size=5, 
    language="id",
    vad_filter=True # prunes static microphone silence
)

print(f"Detected language: {info.language} (Confidence: {info.language_probability})")
for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")`;

const cppCode = `# Clone whisper.cpp source repository
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

# Download lightweight model file (16-bit float)
bash ./models/download-ggml-model.sh medium-id

# Build source optimized for local system acceleration (AVX, Metal, CUDA ok)
make

# Transcribe command line
./main -m models/ggml-medium-id.bin -f input_audio.wav -otxt`;

// ================= INTERNAL CALCULATIONS HELPERS =================
function calculateWerMetric(truth: string, prediction: string) {
  if (!prediction) return 100;
  if (prediction.includes("[UNSUPPORTED")) return 100;
  
  const originalWords = truth.toLowerCase().replace(/[.,!?:'"]/g, '').split(' ');
  const predictedWords = prediction.toLowerCase().replace(/[.,!?:'"]/g, '').split(' ');

  let mismatches = 0;
  originalWords.forEach((word, index) => {
    if (!predictedWords[index] || predictedWords[index] !== word) {
      mismatches++;
    }
  });

  const finalWer = (mismatches / originalWords.length) * 100;
  return Math.min(100, parseFloat(finalWer.toFixed(1)));
}

function getBetterAccuracyModel(a: STTModel, b: STTModel, sample: AudioSample) {
  const isIndo = sample.language.startsWith('Indonesian');
  let scoreA = a.werEnglish;
  let scoreB = b.werEnglish;

  if (isIndo) {
    scoreA = a.werIndonesian;
    scoreB = b.werIndonesian;
  }

  if (sample.mumbled) {
    scoreA = Math.max(scoreA, a.werMumbled);
    scoreB = Math.max(scoreB, b.werMumbled);
  }

  if (scoreA < scoreB) return a.name;
  return b.name;
}

function renderDiffText(truth: string, prediction: string) {
  if (!prediction) return truth;
  if (prediction.startsWith("[UNSUPPORTED")) {
    return <span className="text-red-500 font-mono font-semibold">{prediction}</span>;
  }

  const truthArr = truth.split(' ');
  const predArr = prediction.split(' ');

  return (
    <span>
      {predArr.map((word, idx) => {
        const correspondingTruth = truthArr[idx] || '';
        const isMismatched = word.toLowerCase().replace(/[.,!?:'"]/g, '') !== correspondingTruth.toLowerCase().replace(/[.,!?:'"]/g, '');
        const isPlacer = word.includes('____') || word.includes('...');
        
        return (
          <span 
            key={idx} 
            className={`mr-1 px-0.5 rounded font-medium inline-block ${
              isMismatched || isPlacer
                ? 'bg-amber-100 border-b border-amber-300 text-amber-900 font-semibold' 
                : 'text-slate-850'
            }`}
            title={isMismatched ? `Alignment mismatch. Expected: "${correspondingTruth}"` : undefined}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}
