import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { WaveformTimeline } from './WaveformTimeline';
import { WordTranscript } from './WordTranscript';
import { AudioSample } from '../../types';
import { DialogueProfile } from '../../data/dialogueData';

interface AudioSlicerWaveformProps {
  mode: 'single' | 'dialogue';
  activeSample: AudioSample & { audioUrl?: string };
  activeProfile: DialogueProfile;
  progress: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  isArenaProcessing: boolean;
  clipStart?: number;
  clipEnd?: number;
  onClipChange?: (start: number, end: number) => void;
}

export default function AudioSlicerWaveform({
  mode,
  activeSample,
  activeProfile,
  progress,
  setProgress,
  isArenaProcessing,
  clipStart,
  clipEnd,
  onClipChange
}: AudioSlicerWaveformProps) {
  const duration = useMemo(() => mode === 'dialogue' ? activeProfile.audioDurationSecs : activeSample.audioDurationSecs, [mode, activeSample, activeProfile]);
  const peaks = useMemo(() => mode === 'dialogue' ? [0.2, 0.4, 0.7, 0.5, 0.2, 0.6, 0.8, 0.4, 0.2, 0.5, 0.7, 0.4, 0.2, 0.8, 0.6, 0.3, 0.5, 0.9, 0.7, 0.2, 0.4, 0.8, 0.6, 0.2, 0.5, 0.3, 0.7, 0.6, 0.1, 0.4, 0.8, 0.5, 0.2] : activeSample.mockWaveform, [mode, activeSample]);

  const [localClipStart, setLocalClipStart] = useState(0);
  const [localClipEnd, setLocalClipEnd] = useState(duration);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlayingLocally, setIsPlayingLocally] = useState(false);
  
  const localPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clipStartVal = clipStart !== undefined ? clipStart : localClipStart;
  const clipEndVal = clipEnd !== undefined ? clipEnd : localClipEnd;
  const currentTime = useMemo(() => (progress / 100) * duration, [progress, duration]);

  useEffect(() => {
    if (onClipChange) onClipChange(0, duration);
    else {
      setLocalClipStart(0);
      setLocalClipEnd(duration);
    }
    setIsPlayingLocally(false);
    setProgress(0);
  }, [activeSample, activeProfile, duration, mode, onClipChange]);

  useEffect(() => {
    return () => {
      if (localPlayTimerRef.current) clearInterval(localPlayTimerRef.current);
    };
  }, []);

  // Sync real audio element playback & rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      if (isPlayingLocally) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingLocally, playbackSpeed]);

  useEffect(() => {
    if (isArenaProcessing) {
      setIsPlayingLocally(false);
      return;
    }

    if (isPlayingLocally) {
      const intervalMs = 100;
      const stepSecs = (intervalMs / 1000) * playbackSpeed;

      localPlayTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          const nextTime = (prev / 100) * duration + stepSecs;
          if (nextTime >= clipEndVal) {
            if (audioRef.current) audioRef.current.currentTime = clipStartVal;
            return (clipStartVal / duration) * 100;
          }
          return (nextTime / duration) * 100;
        });
      }, intervalMs);
    } else {
      if (localPlayTimerRef.current) clearInterval(localPlayTimerRef.current);
    }

    return () => {
      if (localPlayTimerRef.current) clearInterval(localPlayTimerRef.current);
    };
  }, [isPlayingLocally, isArenaProcessing, clipStartVal, clipEndVal, duration, setProgress, playbackSpeed]);

  const handlePlayheadChange = (newTime: number) => {
    const boundTime = Math.min(duration, Math.max(0, newTime));
    setProgress((boundTime / duration) * 100);
    if (audioRef.current) audioRef.current.currentTime = boundTime;
  };

  const handleClipChange = (start: number, end: number) => {
    if (onClipChange) onClipChange(start, end);
    else {
      setLocalClipStart(start);
      setLocalClipEnd(end);
    }
    if (currentTime < start || currentTime > end) {
      setProgress((start / duration) * 100);
      if (audioRef.current) audioRef.current.currentTime = start;
    }
  };

  const handleWordClick = (wordStartTime: number) => {
    if (wordStartTime < clipStartVal || wordStartTime > clipEndVal) {
      if (onClipChange) onClipChange(0, duration);
      else {
        setLocalClipStart(0);
        setLocalClipEnd(duration);
      }
    }
    setProgress((wordStartTime / duration) * 100);
    if (audioRef.current) audioRef.current.currentTime = wordStartTime;
    setIsPlayingLocally(true);
  };

  const resetProgress = () => {
    setProgress((clipStartVal / duration) * 100);
    if (audioRef.current) audioRef.current.currentTime = clipStartVal;
    setIsPlayingLocally(false);
  };

  const isClipActive = clipStartVal > 0 || clipEndVal < duration;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-inner text-white space-y-4">
      {activeSample?.audioUrl && (
        <audio ref={audioRef} src={activeSample.audioUrl} className="hidden" loop />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-emerald-900/30 rounded-lg text-emerald-400 border border-emerald-800/35">
            <Volume2 className="w-4.5 h-4.5 animate-pulse" />
          </span>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {mode === 'dialogue' ? activeProfile.name : activeSample.name}
            </h4>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>Duration: {duration.toFixed(1)}s</span>
              <span>|</span>
              <span className="text-emerald-400 font-bold uppercase">
                {isArenaProcessing ? 'SYNCED TO ARENA' : isPlayingLocally ? 'PLAYING PREVIEW' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Rate Controller */}
          <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-750/50 font-mono text-[9px]">
            {([0.5, 1, 2] as const).map((r) => (
              <button
                key={r}
                disabled={isArenaProcessing}
                onClick={() => setPlaybackSpeed(r)}
                className={`px-1.5 py-1 rounded transition-all cursor-pointer ${
                  playbackSpeed === r ? 'bg-indigo-650 text-white font-bold' : 'text-slate-450 hover:text-slate-200'
                } disabled:opacity-45`}
              >
                {r}x
              </button>
            ))}
          </div>

          <button
            disabled={isArenaProcessing}
            onClick={() => setIsPlayingLocally(!isPlayingLocally)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all w-full sm:w-28 cursor-pointer ${
              isPlayingLocally ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : 'bg-slate-800 hover:bg-slate-750'
            } disabled:bg-slate-850 disabled:text-slate-500`}
          >
            {isPlayingLocally ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlayingLocally ? 'Pause' : 'Play Preview'}</span>
          </button>
          <button
            disabled={isArenaProcessing}
            onClick={resetProgress}
            className="p-1.8 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800 disabled:opacity-40"
            title="Reset Playhead"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <WaveformTimeline
        peaks={peaks}
        duration={duration}
        currentTime={currentTime}
        onPlayheadChange={handlePlayheadChange}
        clipStart={clipStartVal}
        clipEnd={clipEndVal}
        onClipChange={handleClipChange}
        isProcessing={isArenaProcessing || isPlayingLocally}
        sampleId={mode === 'dialogue' ? activeProfile.id : activeSample.id}
      />

      {isClipActive && (
        <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-2.5 text-[10px] text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="leading-snug">
            <b>Bilingual Phrase Slicing Active!</b> Playback is now constrained to <b>{clipStartVal.toFixed(1)}s - {clipEndVal.toFixed(1)}s</b>.
          </p>
        </div>
      )}

      <WordTranscript
        mode={mode}
        activeSample={activeSample}
        activeProfile={activeProfile}
        currentTime={currentTime}
        onWordClick={handleWordClick}
        clipStart={clipStartVal}
        clipEnd={clipEndVal}
      />
    </div>
  );
}
