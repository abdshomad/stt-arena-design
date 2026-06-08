import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut, Scissors, RefreshCw, Star } from 'lucide-react';

interface WaveformTimelineProps {
  peaks: number[];
  duration: number;
  currentTime: number;
  onPlayheadChange: (time: number) => void;
  clipStart: number;
  clipEnd: number;
  onClipChange: (start: number, end: number) => void;
  isProcessing: boolean;
  sampleId: string;
}

export function WaveformTimeline({
  peaks,
  duration,
  currentTime,
  onPlayheadChange,
  clipStart,
  clipEnd,
  onClipChange,
  isProcessing,
  sampleId
}: WaveformTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<1 | 2 | 4>(1);

  // Suggested clip ranges based on audio sample to target difficult sections
  const recommendedClips = useMemo(() => {
    switch (sampleId) {
      case 'clear_en':
        return [
          { name: 'STT Jargon', start: 1.2, end: 3.8, desc: '"spinning up faster-whisper"' },
          { name: 'WebSocket Tech', start: 4.5, end: 6.8, desc: '"exposing standard websocket"' }
        ];
      case 'mumble_en':
        return [
          { name: 'C++ Code-Switch', start: 2.8, end: 6.2, desc: '"whisper-cpp with AVX-512"' },
          { name: 'Fast Outro request', start: 8.0, end: 11.2, desc: '"cold brew, by the way"' }
        ];
      case 'clear_id':
        return [
          { name: 'DKI Transport', start: 0.8, end: 3.5, desc: '"mengintegrasikan seluruh sarana"' },
          { name: 'Mobilitas Core', start: 4.8, end: 7.9, desc: '"mempermudah mobilitas"' }
        ];
      case 'slang_id':
        return [
          { name: 'Indo-English Slang', start: 0.0, end: 4.2, desc: '"Jujurly, kita tuh kayak pas nyoba"' },
          { name: 'Model Comparison', start: 5.0, end: 9.0, desc: '"deploy cahya whisper-medium"' }
        ];
      case 'mumble_id':
        return [
          { name: 'Javanese Accent', start: 0.5, end: 4.8, desc: '"Iki loh mas, mending langsung"' },
          { name: 'Faster-Whisper Jargon', start: 5.5, end: 9.8, desc: '"faster-whisper medium"' }
        ];
      case 'customer_support_telco':
        return [
          { name: 'LOS Indicator Red', start: 0.0, end: 3.5, desc: '"Lampu LOS merah berkedip terus"' },
          { name: 'Modem Credentials', start: 3.8, end: 6.5, desc: '"nomor pelanggan dan tipe modem"' },
          { name: 'Frustrated Interruption', start: 6.2, end: 9.2, desc: '"nomor pelanggan saya nggak hafal"' }
        ];
      case 'jaksel_tech_talk':
        return [
          { name: 'Jaksel Tech Slang', start: 0.0, end: 3.0, desc: '"So, menurut gue, scaling local"' },
          { name: 'GPU Cluster Discussion', start: 3.2, end: 6.2, desc: '"maintenance GPU clusters sendiri"' },
          { name: 'Corporate Egress Debate', start: 7.8, end: 11.8, desc: '"Deepgram or ElevenLabs"' }
        ];
      default:
        return [
          { name: 'First Half', start: 0.0, end: duration / 2, desc: 'Isolate initial sounds' },
          { name: 'Second Half', start: duration / 2, end: duration, desc: 'Isolate final sounds' }
        ];
    }
  }, [sampleId, duration]);

  // Handle clicking on the waveform to transition coordinates to playhead times
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const totalWidth = rect.width * zoom;
    const pct = Math.min(1, Math.max(0, clickX / totalWidth));
    onPlayheadChange(pct * duration);
  };

  // Center scroll around updated playhead in horizontal scrolling view when zoomed
  useEffect(() => {
    if (zoom > 1 && scrollRef.current && containerRef.current) {
      const parentWidth = scrollRef.current.clientWidth;
      const totalWidth = parentWidth * zoom;
      const playheadX = (currentTime / duration) * totalWidth;
      const idealScroll = playheadX - parentWidth / 2;
      scrollRef.current.scrollTo({
        left: idealScroll,
        behavior: 'smooth'
      });
    }
  }, [currentTime, zoom, duration]);

  const timelineTicks = useMemo(() => {
    const ticksCount = zoom === 1 ? Math.floor(duration) : Math.floor(duration * 2);
    const result = [];
    for (let i = 0; i <= ticksCount; i++) {
      const timeVal = zoom === 1 ? i : i * 0.5;
      if (timeVal <= duration) {
        result.push(timeVal);
      }
    }
    return result;
  }, [duration, zoom]);

  return (
    <div className="space-y-4">
      {/* Zoom and Playback controls bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="p-1.5 bg-slate-800 text-indigo-400 rounded-lg shrink-0">
            <Scissors className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
            Slicer Window: {clipStart.toFixed(1)}s - {clipEnd.toFixed(1)}s
          </span>
        </div>

        {/* Zoom controls Selector buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-500 mr-1.5 uppercase">Timeline Zoom:</span>
          <button
            onClick={() => setZoom(1)}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md border ${
              zoom === 1 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            } cursor-pointer`}
          >
            1x
          </button>
          <button
            onClick={() => setZoom(2)}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md border ${
              zoom === 2 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            } cursor-pointer`}
          >
            2x Zoom
          </button>
          <button
            onClick={() => setZoom(4)}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md border ${
              zoom === 4 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            } cursor-pointer`}
          >
            4x SuperZoom
          </button>
        </div>
      </div>

      {/* Waveform wrapper container */}
      <div ref={scrollRef} className="bg-slate-950 border border-slate-850 rounded-xl p-4 overflow-x-auto select-none scrollbar-thin relative scroll-smooth">
        <div
          ref={containerRef}
          onClick={handleWaveformClick}
          className="h-24 relative flex items-end justify-between cursor-pointer gap-[2px] pt-4"
          style={{ width: `${100 * zoom}%` }}
        >
          {/* Ticks Grid Lines in background */}
          <div className="absolute inset-x-0 top-0 border-b border-slate-900 flex justify-between text-[8px] font-mono text-slate-600 pb-1 pt-1">
            {timelineTicks.map((tick, i) => {
              const positionPct = (tick / duration) * 100;
              const isHalfSecond = tick % 1 !== 0;
              return (
                <div
                  key={i}
                  className="absolute border-l border-slate-850/80 pl-1 h-3 flex flex-col justify-between"
                  style={{ left: `${positionPct}%`, height: isHalfSecond ? '8px' : '15px' }}
                >
                  {!isHalfSecond && <span className="opacity-80">{tick.toFixed(0)}s</span>}
                </div>
              );
            })}
          </div>

          {/* Shaded boundaries representing clipped sections */}
          <div
            className="absolute inset-y-0 left-0 bg-slate-950/85 border-r border-dashed border-red-500/20 backdrop-blur-[0.5px] pointer-events-none"
            style={{ width: `${(clipStart / duration) * 100}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-slate-950/85 border-l border-dashed border-red-505/20 backdrop-blur-[0.5px] pointer-events-none"
            style={{ left: `${(clipEnd / duration) * 100}%` }}
          />

          {/* Glowing bounds marker of active segment */}
          <div
            className="absolute inset-y-0 bg-indigo-500/5 border-x border-dashed border-indigo-500/25 pointer-events-none"
            style={{
              left: `${(clipStart / duration) * 100}%`,
              width: `${((clipEnd - clipStart) / duration) * 100}%`
            }}
          />

          {/* Peak Bars representing sound waves */}
          {peaks.map((peak, index) => {
            const positionPct = (index / peaks.length) * duration;
            const isInSegment = positionPct >= clipStart && positionPct <= clipEnd;
            const isFinished = positionPct <= currentTime;
            const motionMultiplier = isProcessing ? (Math.sin((index + currentTime * 5) * 0.4) * 0.2 + 0.8) : 1;
            const finalHeight = `${Math.max(5, peak * 85 * motionMultiplier)}%`;

            let barColor = 'bg-slate-800';
            if (isInSegment) {
              barColor = isFinished ? 'bg-gradient-to-t from-emerald-450 to-indigo-400 bg-emerald-400' : 'bg-indigo-600/70';
            }

            return (
              <div
                key={index}
                className={`w-full rounded-md transition-all duration-150 ${barColor}`}
                style={{ height: finalHeight }}
              />
            );
          })}

          {/* Playhead bar pointer indicator line */}
          <div
            className="absolute inset-y-0 w-0.5 bg-amber-400 shadow-[0_0_10px_#f59e0b] pointer-events-none z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-950 rounded-full flex items-center justify-center font-bold text-[7px] text-slate-900 shadow">
              ▶
            </div>
          </div>
        </div>
      </div>

      {/* Manual Dual Slider Seekbars */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex justify-between">
            <span>⏱️ Clip Start:</span>
            <span className="text-indigo-600">{clipStart.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0"
            max={clipEnd - 0.5}
            step="0.1"
            value={clipStart}
            onChange={(e) => onClipChange(Math.max(0, parseFloat(e.target.value)), clipEnd)}
            className="w-full h-1.5 accent-indigo-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex justify-between">
            <span>⏱️ Clip End:</span>
            <span className="text-indigo-600">{clipEnd.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min={clipStart + 0.5}
            max={duration}
            step="0.1"
            value={clipEnd}
            onChange={(e) => onClipChange(clipStart, Math.min(duration, parseFloat(e.target.value)))}
            className="w-full h-1.5 accent-indigo-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Preset Phrases */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
          🎯 Recommended clipping targets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {recommendedClips.map((clip, idx) => (
            <button
              key={idx}
              onClick={() => onClipChange(clip.start, clip.end)}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] text-left transition-all duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Star className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />
              <span className="font-semibold text-slate-705 text-slate-700">{clip.name}:</span>
              <span className="text-slate-450 truncate max-w-[130px] italic">{clip.desc}</span>
            </button>
          ))}
          <button
            onClick={() => onClipChange(0, duration)}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-lg text-[10px] text-indigo-700 font-semibold transition-all duration-150 flex items-center gap-1 cursor-pointer ml-auto"
          >
            <RefreshCw className="w-3 h-3" /> Clear Clipping window
          </button>
        </div>
      </div>
    </div>
  );
}
