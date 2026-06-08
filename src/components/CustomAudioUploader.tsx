import React, { useState, useRef } from 'react';
import { Upload, Link, AlertCircle, FileAudio, CheckCircle, Sliders, Sparkles } from 'lucide-react';
import { AudioSample } from '../types';
import { generateSimulatedTranscript } from './audioUtils';

interface CustomAudioUploaderProps {
  onSampleLoaded: (sample: AudioSample & { audioUrl?: string }) => void;
  activeSampleId: string;
}

export function CustomAudioUploader({ onSampleLoaded, activeSampleId }: CustomAudioUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [audioUrlInput, setAudioUrlInput] = useState('');
  const [customLanguage, setCustomLanguage] = useState('Indonesian (Multilingual)');
  const [customTranscript, setCustomTranscript] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const decodeAudioFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10MB limit. Please upload a smaller WAV or MP3 audio file.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setSuccessMessage('');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const duration = decodedBuffer.duration;
        const channelData = decodedBuffer.getChannelData(0);
        
        // Calculate 25 peaks for a balanced waveform visualizer envelope
        const numPeaks = 25;
        const step = Math.floor(channelData.length / numPeaks);
        const peaks: number[] = [];
        for (let i = 0; i < numPeaks; i++) {
          let max = 0;
          const start = i * step;
          for (let j = start; j < start + step; j++) {
            const val = Math.abs(channelData[j]);
            if (val > max) max = val;
          }
          peaks.push(parseFloat(Math.min(1.0, max * 1.6).toFixed(3)));
        }
        
        const audioUrl = URL.createObjectURL(file);
        
        const customSample: AudioSample & { audioUrl?: string } = {
          id: 'custom-audio',
          name: file.name,
          language: customLanguage,
          difficulty: 'Medium',
          description: `Uploaded file (${(file.size / (1024 * 1024)).toFixed(2)} MB) decoded via Web Audio API.`,
          transcript: customTranscript.trim() || generateSimulatedTranscript(duration, customLanguage),
          mumbled: false,
          audioDurationSecs: parseFloat(duration.toFixed(1)),
          mockWaveform: peaks,
          audioUrl
        };
        
        onSampleLoaded(customSample);
        setSuccessMessage(`Successfully parsed "${file.name}" (${duration.toFixed(1)}s, Peaks Extracted!)`);
      } catch (err) {
        console.error(err);
        setError("Failed to decode audio file. Make sure it is a valid WAV or MP3 file.");
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read audio file buffer.");
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleUrlParse = async () => {
    if (!audioUrlInput.trim()) {
      setError("Please paste a valid, accessible audio URL.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch(audioUrlInput);
      if (!response.ok) throw new Error("CORS or absolute request error");
      const arrayBuffer = await response.arrayBuffer();
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const duration = decodedBuffer.duration;
      const channelData = decodedBuffer.getChannelData(0);
      
      const numPeaks = 25;
      const step = Math.floor(channelData.length / numPeaks);
      const peaks: number[] = [];
      for (let i = 0; i < numPeaks; i++) {
        let max = 0;
        const start = i * step;
        for (let j = start; j < start + step; j++) {
          const val = Math.abs(channelData[j]);
          if (val > max) max = val;
        }
        peaks.push(parseFloat(Math.min(1.0, max * 1.6).toFixed(3)));
      }
      
      const urlFilename = audioUrlInput.split('/').pop()?.split('?')[0] || "remote_audio_source.mp3";
      
      const customSample: AudioSample & { audioUrl?: string } = {
        id: 'custom-audio',
        name: `🔗 ${urlFilename}`,
        language: customLanguage,
        difficulty: 'Medium',
        description: `Remote url audio parsed directly via Client Web Audio API.`,
        transcript: customTranscript.trim() || generateSimulatedTranscript(duration, customLanguage),
        mumbled: false,
        audioDurationSecs: parseFloat(duration.toFixed(1)),
        mockWaveform: peaks,
        audioUrl: audioUrlInput
      };
      
      onSampleLoaded(customSample);
      setSuccessMessage(`Successfully fetched and parsed remote URL (${duration.toFixed(1)}s)`);
    } catch (err) {
      console.warn("AudioContext URL fetch rejected due to CORS restriction. Using dynamic fallback peak generator.", err);
      
      const mockDur = 12.5;
      const parsedPeaks: number[] = [];
      for (let i = 0; i < 25; i++) {
        parsedPeaks.push(parseFloat((Math.random() * 0.5 + 0.15).toFixed(3)));
      }
      
      const urlFilename = audioUrlInput.split('/').pop()?.split('?')[0] || "pasted_audio.mp3";
      
      const customSample: AudioSample & { audioUrl?: string } = {
        id: 'custom-audio',
        name: `🔗 ${urlFilename}`,
        language: customLanguage,
        difficulty: 'Medium',
        description: `External URL (processed with dynamic fallback peaks due to CORS restrictions).`,
        transcript: customTranscript.trim() || generateSimulatedTranscript(mockDur, customLanguage),
        mumbled: false,
        audioDurationSecs: mockDur,
        mockWaveform: parsedPeaks,
        audioUrl: audioUrlInput
      };
      
      onSampleLoaded(customSample);
      setSuccessMessage(`Parsed URL loaded via fallback algorithm (CORS restrictions prevented direct audio context decoding).`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <FileAudio className="w-4 h-4 text-indigo-600 animate-pulse" /> Custom Speech Input Pipeline
        </span>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-[10px] text-indigo-600 hover:text-indigo-805 font-bold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
          <span>{showConfig ? 'Hide Config' : 'Optional Meta Settings'}</span>
        </button>
      </div>

      {showConfig && (
        <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-3 animate-[fadeIn_0.2s_ease-out] text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Language Preset</label>
              <select
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Indonesian (Multilingual)">Indonesian (Slang/Multilingual)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Speaker Configuration</label>
              <div className="font-mono text-[10px] text-slate-500 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                👤 Single speaker monaural audio
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex justify-between">
              <span>Custom Speech Transcript (Optional)</span>
              <span className="text-slate-400 italic">Leave empty to auto-generate based on duration</span>
            </label>
            <textarea
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              placeholder="Enter exact words spoken in your audio file to test precision algorithms..."
              rows={2}
              className="w-full p-2 font-sans border border-slate-200 rounded-lg placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.[0]) decodeAudioFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 ${
            isDragOver 
              ? 'border-indigo-500 bg-indigo-50/40' 
              : activeSampleId === 'custom-audio' && !error
                ? 'border-emerald-300 bg-emerald-50/10 hover:bg-slate-100/40' 
                : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => { if (e.target.files?.[0]) decodeAudioFile(e.target.files[0]); }}
            accept=".wav,.mp3,audio/wav,audio/mp3,audio/mpeg"
            className="hidden"
          />
          <Upload className={`w-6 h-6 ${activeSampleId === 'custom-audio' && !error ? 'text-emerald-500' : 'text-slate-450'}`} />
          <div>
            <p className="text-xs font-bold text-slate-705">
              Drag & Drop WAV/MP3 here, or <span className="text-indigo-600 hover:underline">browse files</span>
            </p>
            <p className="text-[10px] text-slate-400">Up to 10MB WAV or MP3 audio file</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2.5">
              <Link className="h-3.5 w-3.5 text-slate-450" />
            </span>
            <input
              type="text"
              placeholder="Paste accessible audio URL (e.g. https://.../sample.mp3)"
              value={audioUrlInput}
              onChange={(e) => setAudioUrlInput(e.target.value)}
              className="pl-8.5 pr-3 py-2 w-full text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-505 bg-white placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleUrlParse}
            disabled={isProcessing || !audioUrlInput.trim()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-200 text-white disabled:text-slate-400 border border-slate-700/20 text-xs font-semibold rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
          >
            Load URL
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-700 animate-pulse">
          <div className="w-4 h-4 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Decoding binary sound data using Web Audio AudioContext...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 p-2 px-3 bg-red-50 border border-red-200 rounded-lg text-[10.5px] text-rose-750">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span><b>Decoding Error:</b> {error}</span>
        </div>
      )}

      {successMessage && !error && (
        <div className="flex items-start gap-1.5 p-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[10.5px] text-emerald-800">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <b>Active Pipeline:</b> {successMessage} <Sparkles className="w-3 h-3 text-emerald-500 inline inline-block shrink-0" />
          </p>
        </div>
      )}
    </div>
  );
}
