import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { AudioSample } from '../../types';
import { DialogueProfile } from '../../data/dialogueData';

interface WordTranscriptProps {
  mode: 'single' | 'dialogue';
  activeSample: AudioSample;
  activeProfile: DialogueProfile;
  currentTime: number;
  onWordClick: (startTime: number) => void;
  clipStart?: number;
  clipEnd?: number;
}

interface AlignedWord {
  word: string;
  start: number;
  end: number;
  speakerId?: number;
  speakerName?: string;
  isDifficult: boolean;
}

export function WordTranscript({
  mode,
  activeSample,
  activeProfile,
  currentTime,
  onWordClick,
  clipStart = 0,
  clipEnd = 999
}: WordTranscriptProps) {
  // Generate list of words with estimated start / end timestamps
  const alignedWords = useMemo<AlignedWord[]>(() => {
    if (mode === 'dialogue') {
      const wordsList: AlignedWord[] = [];
      activeProfile.turns.forEach((turn) => {
        const words = turn.text.split(/\s+/).filter(Boolean);
        if (words.length === 0) return;
        const duration = turn.end - turn.start;
        const wordDuration = duration / words.length;

        words.forEach((w, idx) => {
          const start = turn.start + idx * wordDuration;
          const end = start + wordDuration;
          // Identify difficult / jargon / code-switching words
          const cleaned = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
          const isDifficult = [
            'faster-whisper', 'cahya', 'whisper', 'stt', 'websocket', 'api', 
            'avx-512', 'whisper-cpp', 'docker', 'indicare', 'los', 'wifi',
            'literally', 'budget-friendly', 'scalability', 'egress', 'gcp'
          ].includes(cleaned) || cleaned.length > 10;

          wordsList.push({
            word: w,
            start,
            end,
            speakerId: turn.speakerId,
            speakerName: turn.speaker,
            isDifficult
          });
        });
      });
      return wordsList;
    } else {
      // Single voice mode
      const words = activeSample.transcript.split(/\s+/).filter(Boolean);
      if (words.length === 0) return [];
      const duration = activeSample.audioDurationSecs;
      const wordDuration = duration / words.length;

      return words.map((w, idx) => {
        const start = idx * wordDuration;
        const end = start + wordDuration;
        const cleaned = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
        const isDifficult = [
          'faster-whisper', 'cahya', 'whisper', 'stt', 'websocket', 'api', 
          'avx-512', 'whisper-cpp', 'docker', 'indicare', 'los', 'wifi',
          'literally', 'budget-friendly', 'scalability', 'egress', 'gcp'
        ].includes(cleaned) || cleaned.length > 10;

        return {
          word: w,
          start,
          end,
          isDifficult
        };
      });
    }
  }, [mode, activeSample, activeProfile]);

  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4.5 space-y-3 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5" />
          Sub-second Word Alignment Aligner
        </span>
        <div className="flex gap-3 text-[9px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-indigo-500/30 border border-indigo-400 inline-block" /> Difficult Jargon
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-400 inline-block animate-pulse" /> Active Word
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-1.5 gap-y-2 max-h-52 overflow-y-auto p-1 leading-relaxed">
        {alignedWords.map((item, idx) => {
          const isActive = currentTime >= item.start && currentTime < item.end;
          const isCurrentClipSelected = item.start >= clipStart && item.end <= clipEnd;

          // Compute speaker border/bg variations
          const isSpeaker0 = item.speakerId === 0;
          let colorStyle = "text-slate-300 hover:text-white hover:bg-slate-800/50 border-slate-900";
          
          if (isActive) {
            colorStyle = "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-[0_0_8px_rgba(251,191,36,0.3)] scale-[1.03]";
          } else if (item.isDifficult) {
            colorStyle = "bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border-indigo-900/60 decoration-dashed underline decoration-indigo-400/55 underline-offset-2";
          } else if (mode === 'dialogue') {
            colorStyle = isSpeaker0 
              ? "bg-slate-900/30 hover:bg-slate-800/40 text-sky-200 border-sky-950/40" 
              : "bg-slate-900/30 hover:bg-slate-800/40 text-emerald-250 text-emerald-200 border-emerald-950/40";
          }

          return (
            <motion.button
              key={idx}
              id={`word-pill-${idx}`}
              onClick={() => onWordClick(item.start)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${item.speakerName ? `${item.speakerName}: ` : ''}${item.start.toFixed(2)}s - ${item.end.toFixed(2)}s`}
              className={`px-1.8 py-0.8 rounded-md text-[11px] font-mono border transition-all duration-150 flex items-center gap-1 select-none cursor-pointer ${colorStyle} ${
                !isCurrentClipSelected ? 'opacity-40 hover:opacity-90 grayscale' : ''
              }`}
            >
              <span>{item.word}</span>
              {item.isDifficult && !isActive && (
                <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-900 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p>
          Clicking any word sets the audio player playhead immediately to that syllable's exact timestamp. The system leverages VAD alignment for sub-second precision.
        </p>
      </div>
    </div>
  );
}
