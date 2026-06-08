export interface STTModel {
  id: string;
  name: string;
  multilingual: boolean;
  indonesianSupport: boolean;
  emotionDetection: boolean;
  mumblingRobustness: boolean;
  indonesiaSpecific: boolean;
  sourceType: 'Local / CTranslate2' | 'Local / PyTorch' | 'Local / C++' | 'Local / NeMo' | 'Local / Meta MMS' | 'Local / Edge AI' | 'Local / Multi-modal' | 'Local / LLM Audio' | 'Local' | 'HuggingFace';
  
  // Simulated benchmark metrics for developers to do real comparison:
  werEnglish: number; // Word Error Rate % on Clear English (lower is better)
  werIndonesian: number; // Word Error Rate % on Indonesian (lower is better, 0 or high if not supported)
  werMumbled: number; // Word Error Rate % on Mumbled audio (lower is better)
  latencyMs: number; // Simulation for a standard 10-second audio clip (lower is better)
  vramRequiredGb: number; // Approximate GPU RAM required in GB
  cpuViability: 'Excellent' | 'Good' | 'Poor' | 'Not Feasible';
  throughputWordsPerSec: number; // Higher is better
  license: 'Apache-2.0' | 'MIT' | 'GPL-3.0' | 'Proprietary' | 'CC-BY-NC-4.0' | 'Research-Only';
}

export interface CloudAlternative {
  name: string;
  company: string;
  costPerMillionWords: number; // USD
  avgLatencyMs: number;
  accuracyWer: number;
  customizationOptions: string[];
  integrationComplexity: 'Low' | 'Medium' | 'High';
  pros: string[];
  cons: string[];
  id: string;
}

export interface AudioSample {
  id: string;
  name: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  transcript: string;
  mumbled: boolean;
  audioDurationSecs: number;
  mockWaveform: number[];
}
