import React from 'react';
import { Activity, Brain, Globe, Sparkles } from 'lucide-react';

export interface WeightPreset {
  id: string;
  name: string;
  description: string;
  weights: {
    accuracy: number;
    latency: number;
    indonesian: number;
    resource: number;
  };
  icon: string;
}

export const WEIGHT_PRESETS: WeightPreset[] = [
  {
    id: 'call_center',
    name: 'Call Center',
    description: 'Prioritizing accuracy, latency & standard/dialect Indonesian support for dynamic business operations.',
    weights: { accuracy: 50, latency: 25, indonesian: 20, resource: 5 },
    icon: 'Activity'
  },
  {
    id: 'medical',
    name: 'Medical Dictation',
    description: 'Strongly scales spelling accuracy for high-density, complex professional vocabulary.',
    weights: { accuracy: 80, latency: 10, indonesian: 5, resource: 5 },
    icon: 'Brain'
  },
  {
    id: 'bilingual',
    name: 'Bilingual Interview',
    description: 'Optimal balance for multi-language dialogs, code-switching, and regional dialects.',
    weights: { accuracy: 40, latency: 15, indonesian: 35, resource: 10 },
    icon: 'Globe'
  },
  {
    id: 'slang',
    name: 'Indonesian Slang',
    description: 'Accents regional slang words (Anak Jaksel style), colloquial dialects & Javanese phonetics.',
    weights: { accuracy: 15, latency: 15, indonesian: 60, resource: 10 },
    icon: 'Sparkles'
  }
];

interface WeightPresetsProps {
  currentWeights: {
    accuracy: number;
    latency: number;
    indonesian: number;
    resource: number;
  };
  onPresetSelect: (weights: { accuracy: number; latency: number; indonesian: number; resource: number }) => void;
}

export const WeightPresets: React.FC<WeightPresetsProps> = ({ currentWeights, onPresetSelect }) => {
  return (
    <div className="space-y-2 mt-4 border-t border-slate-100 pt-3">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optimize Scenario Presets</span>
      <div className="grid grid-cols-2 gap-2">
        {WEIGHT_PRESETS.map((preset) => {
          const isSelected =
            currentWeights.accuracy === preset.weights.accuracy &&
            currentWeights.latency === preset.weights.latency &&
            currentWeights.indonesian === preset.weights.indonesian &&
            currentWeights.resource === preset.weights.resource;

          return (
            <button
              id={`preset-btn-${preset.id}`}
              key={preset.id}
              onClick={() => onPresetSelect(preset.weights)}
              className={`p-2 rounded-xl border text-left text-[11px] font-sans transition-all flex flex-col gap-1 cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 shadow-sm font-semibold'
                  : 'border-slate-200 hover:border-slate-350 text-slate-650 bg-white hover:bg-slate-50'
              }`}
              title={preset.description}
            >
              <div className="flex items-center gap-1">
                {preset.icon === 'Activity' && <Activity className="w-3.5 h-3.5 text-indigo-500" />}
                {preset.icon === 'Brain' && <Brain className="w-3.5 h-3.5 text-rose-500" />}
                {preset.icon === 'Globe' && <Globe className="w-3.5 h-3.5 text-emerald-500" />}
                {preset.icon === 'Sparkles' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                <span className="truncate font-semibold">{preset.name}</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight line-clamp-1">{preset.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
