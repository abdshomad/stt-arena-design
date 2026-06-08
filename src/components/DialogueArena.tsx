import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  Fingerprint, 
  Activity, 
  HelpCircle, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { STTModel } from '../types';
import { DialogueProfile, DialogueTurn } from '../data/dialogueData';

interface DialogueArenaProps {
  modelA: any;
  modelB: any;
  profile: DialogueProfile;
  progress: number;
  isProcessing: boolean;
  isCompleted: boolean;
  clipStart?: number;
  clipEnd?: number;
}

export function DialogueArena({
  modelA,
  modelB,
  profile,
  progress,
  isProcessing,
  isCompleted,
  clipStart = 0,
  clipEnd = 999
}: DialogueArenaProps) {
  // Determine diarization quality capabilities for each model
  const getDiarizationCapability = (model: any) => {
    // Premium cloud endpoints or parameter-dense local research nodes excel 
    const isPremiumCloud = model.isCloud && (model.id === 'elevenlabs-stt' || model.id === 'gcp-stt' || model.id === 'assembly-ai');
    const isHeavyLocal = !model.isCloud && (model.id.includes('large') || model.id.includes('v3') || model.id.includes('omni') || model.id.includes('nemotron'));
    
    if (isPremiumCloud || isHeavyLocal) {
      return {
        level: 'SOTA' as const,
        description: 'VAD + PyAnnote v3.1 Sub-second Alignment Active',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        overlapAccuracy: '98%',
        attributionRate: '100%'
      };
    } else if (model.indonesianSupport && model.id.includes('medium')) {
      return {
        level: 'Moderate' as const,
        description: 'VAD Active. Manual phrase alignment. Minor delay.',
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        overlapAccuracy: '78%',
        attributionRate: '90%'
      };
    } else {
      return {
        level: 'Unsupported' as const,
        description: 'No Diarization backend pipeline loaded. Speakers merged.',
        colorClass: 'bg-red-50 text-red-700 border-red-200',
        overlapAccuracy: 'Failed / Overlap merged',
        attributionRate: 'Merged (Single stream)'
      };
    }
  };

  const capA = useMemo(() => getDiarizationCapability(modelA), [modelA]);
  const capB = useMemo(() => getDiarizationCapability(modelB), [modelB]);

  // Simulate a transcript segment with errors corresponding to model quality
  const getSimulatedSegmentText = (turn: DialogueTurn, model: any) => {
    let errorRate = model.werEnglish;
    if (profile.id.includes('telco') || profile.id.includes('jaksel')) {
      errorRate = model.werIndonesian === 99 ? 45 : model.werIndonesian;
    }
    if (profile.difficulty === 'Hard') errorRate = Math.max(errorRate, model.werMumbled || 20);

    if (model.werEnglish > 15 && !model.indonesianSupport && (profile.id.includes('telco') || profile.id.includes('jaksel'))) {
      return `[Mismatched Language Engine Token Error: ${turn.text.split(' ').slice(0, 3).join(' ')}... ???]`;
    }

    const words = turn.text.split(' ');
    const modeledText = words.map((w, index) => {
      const seed = Math.random() * 100;
      if (seed < errorRate) {
        if (seed < errorRate * 0.3) return '____'; // word drop
        if (seed < errorRate * 0.6) return w.toLowerCase() + '(?)'; // unconfident node
        return w.substring(0, Math.max(2, w.length - 2)) + '...'; // slurring
      }
      return w;
    }).join(' ');

    return modeledText;
  };

  // Render comparative outputs for a model alignment channel
  const renderDiarizationTimeline = (model: any, capability: ReturnType<typeof getDiarizationCapability>) => {
    if (!isProcessing && !isCompleted) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl h-80 text-center">
          <Users className="w-8 h-8 text-slate-350 mb-2 animate-bounce" />
          <h5 className="font-semibold text-slate-700 text-xs">Awaiting Arena Inception</h5>
          <p className="text-[10px] text-slate-450 max-w-xs mt-1">Initiate speech compilation to plot timeline alignments.</p>
        </div>
      );
    }

    const maxSecretTime = profile.audioDurationSecs;
    const activeTime = (progress / 100) * maxSecretTime;

    if (capability.level === 'Unsupported') {
      // Model lacks diarization. Combine all text turns progressively.
      const joinedText = profile.turns
        .filter(t => t.start <= activeTime)
        .map(t => getSimulatedSegmentText(t, model))
        .join(' [Overlapping crosstalk skipped] ');

      return (
        <div className="space-y-3.5">
          <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px]">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="text-rose-800 leading-normal">
              <b>Diarization Pipeline Failure:</b> {model.name} was compiled without voice clustering. Multichannel audio was downmixed to monaural stream on single target registry.
            </div>
          </div>
          <div className="p-4 bg-slate-950 text-slate-350 font-mono text-[11px] rounded-2xl border border-slate-800 leading-relaxed min-h-60 relative overflow-hidden shadow-inner">
            <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/40 px-1.5 py-0.2 rounded absolute top-2 right-2 uppercase font-sans">Monaural Downmix</span>
            <div className="text-yellow-400 mb-1.5 flex items-center gap-1 text-[10px]">
              <Clock className="w-3.5 h-3.5" /> [0.0s - {activeTime.toFixed(1)}s] Stream Source 
            </div>
            {joinedText || <span className="text-slate-600 italic">Listening for continuous mono frames...</span>}
            {isProcessing && <span className="animate-pulse bg-emerald-400 w-1.5 h-3 inline-block ml-1" />}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 relative max-h-[480px] overflow-y-auto pr-1">
        {profile.turns.map((turn, index) => {
          // Check if turn is within the clip window boundaries
          if (turn.end < clipStart || turn.start > clipEnd) return null;
          const isTurnActive = activeTime >= turn.start;
          if (!isTurnActive) return null;

          const delayMultiplier = capability.level === 'Moderate' ? (turn.speakerId === 1 ? 0.6 : 0) : 0;
          const turnTimeOffset = activeTime - (turn.start + delayMultiplier);
          const revealPortion = Math.min(1, Math.max(0, turnTimeOffset / (turn.end - turn.start)));
          
          if (revealPortion <= 0) return null;

          const visibleWordsCount = Math.ceil(revealPortion * turn.text.split(' ').length);
          const baseSimmedText = getSimulatedSegmentText(turn, model);
          const revealedText = baseSimmedText.split(' ').slice(0, visibleWordsCount).join(' ');

          const isOverlapRegion = profile.hasOverlays && (index > 0 && turn.start < profile.turns[index - 1].end);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl border relative transition-all ${
                turn.speakerId === 0 
                  ? 'bg-indigo-50/40 border-indigo-100 mr-6 shadow-sm' 
                  : 'bg-emerald-50/30 border-emerald-100/70 ml-6 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between border-b border-dashed border-slate-200/60 pb-1.5 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 font-sans ${
                  turn.speakerId === 0 ? 'text-indigo-700' : 'text-emerald-700'
                }`}>
                  <Fingerprint className="w-3.5 h-3.5" />
                  {turn.speaker}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold flex items-center gap-0.5">
                  <Clock className="w-3 h-3 text-slate-400" /> [{turn.start.toFixed(1)}s - {turn.end.toFixed(1)}s]
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                "{revealedText}"
                {revealPortion < 1 && <span className="animate-pulse text-indigo-500">...</span>}
              </p>

              {isOverlapRegion && (
                <div className="mt-2 flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 border border-amber-100 rounded-md px-1.5 py-0.5 self-start font-medium select-none animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Overlap Cross-talk Detected & Segmented</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-tight">Active Multi-Speaker Diarization Timeline</h4>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Comparative aligned tracking and crosstalk overlaps analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1 font-mono text-[9px] text-slate-500 font-semibold uppercase">
          <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
          <span>Sync State Progress: {progress}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* MODEL A PANEL COLUMN */}
        <div className="space-y-4 border-r border-dashed border-slate-100 pr-0 md:pr-3">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <div>
              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-md uppercase">DECODING PIPELINE A</span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{modelA.name}</h4>
            </div>
            <div className={`px-2 py-0.8 rounded-lg text-[9px] font-mono font-bold border ${capA.colorClass}`}>
              {capA.level}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Overlap Timing precision:</span>
              <span className="font-mono font-bold text-slate-800">{capA.overlapAccuracy}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Speaker Attribution rate:</span>
              <span className="font-mono font-bold text-slate-800">{capA.attributionRate}</span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 min-h-72">
            {renderDiarizationTimeline(modelA, capA)}
          </div>
        </div>

        {/* MODEL B PANEL COLUMN */}
        <div className="space-y-4 pl-0 md:pl-2">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <div>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-md uppercase">DECODING PIPELINE B</span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{modelB.name}</h4>
            </div>
            <div className={`px-2 py-0.8 rounded-lg text-[9px] font-mono font-bold border ${capB.colorClass}`}>
              {capB.level}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Overlap Timing precision:</span>
              <span className="font-mono font-bold text-slate-800">{capB.overlapAccuracy}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Speaker Attribution rate:</span>
              <span className="font-mono font-bold text-slate-800">{capB.attributionRate}</span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 min-h-72">
            {renderDiarizationTimeline(modelB, capB)}
          </div>
        </div>
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs leading-normal"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700">Diarization Verdict:</span>
            <span className="text-slate-500">
              {capA.level === 'SOTA' && capB.level === 'SOTA' ? (
                `Both engines successfully segmented and aligned the multi-turn crossover voices.`
              ) : capA.level === 'SOTA' ? (
                `Model A (${modelA.name}) successfully isolated speakers and overlaps, while Model B downmixed or lagged.`
              ) : capB.level === 'SOTA' ? (
                `Model B (${modelB.name}) successfully isolated speakers and overlaps, while Model A downmixed or lagged.`
              ) : (
                `Both models suffered speaker attribution errors due to lack of optimized sub-second diarization pipelines.`
              )}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
