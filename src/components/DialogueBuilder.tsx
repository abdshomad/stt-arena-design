import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  ArrowUpDown, 
  Save, 
  RotateCcw,
  Info,
  Layers,
  X
} from 'lucide-react';
import { DialogueProfile, DialogueTurn } from '../data/dialogueData';
import { DialogueTimingTable } from './DialogueTimingTable';

interface DialogueBuilderProps {
  initialProfile: DialogueProfile;
  onSave: (updatedProfile: DialogueProfile) => void;
  onClose: () => void;
}

export function DialogueBuilder({ initialProfile, onSave, onClose }: DialogueBuilderProps) {
  const [profileName, setProfileName] = useState(initialProfile.name);
  const [language, setLanguage] = useState(initialProfile.language);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(initialProfile.difficulty);
  const [description, setDescription] = useState(initialProfile.description);
  
  const [turns, setTurns] = useState<DialogueTurn[]>(() => 
    initialProfile.turns.map(t => ({ ...t }))
  );

  const overlaps = useMemo(() => {
    const list: string[] = [];
    const sorted = [...turns].map((t, idx) => ({ ...t, originalIndex: idx })).sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.start < prev.end) {
        list.push(`Turn ${curr.originalIndex + 1} ("${curr.speaker.split(' ')[0]}") starts at ${curr.start}s before Turn ${prev.originalIndex + 1} finishes at ${prev.end}s`);
      }
    }
    return list;
  }, [turns]);

  const totalDuration = useMemo(() => {
    if (turns.length === 0) return 0;
    return Math.max(...turns.map(t => t.end));
  }, [turns]);

  const handleUpdateTurn = (index: number, field: keyof DialogueTurn, value: any) => {
    setTurns(prev => prev.map((t, i) => {
      if (i !== index) return t;
      const updated = { ...t, [field]: value };
      if (field === 'speakerId') {
        updated.speaker = (value as number) === 0 ? 'Speaker 0 (Customer)' : 'Speaker 1 (Agent)';
      }
      return updated;
    }));
  };

  const handleAddTurn = () => {
    const lastTurn = turns[turns.length - 1];
    const nextStart = lastTurn ? lastTurn.end + 0.5 : 0;
    const nextEnd = nextStart + 3.0;
    
    const newTurn: DialogueTurn = {
      speaker: 'Speaker 1 (Agent)',
      speakerId: 1,
      start: parseFloat(nextStart.toFixed(1)),
      end: parseFloat(nextEnd.toFixed(1)),
      text: 'Silakan sampaikan kendala atau pertanyaan tambahan Anda agar saya bantu terus.'
    };
    setTurns(prev => [...prev, newTurn]);
  };

  const handleDeleteTurn = (index: number) => {
    setTurns(prev => prev.filter((_, i) => i !== index));
  };

  const handleSortTurns = () => {
    setTurns(prev => [...prev].sort((a, b) => a.start - b.start));
  };

  const handleSimulateOverlap = (index: number) => {
    if (index === 0) return;
    setTurns(prev => {
      const copy = [...prev];
      const prevEnd = copy[index - 1].end;
      copy[index].start = Math.max(0, parseFloat((prevEnd - 1.2).toFixed(1)));
      if (copy[index].end <= copy[index].start) {
        copy[index].end = parseFloat((copy[index].start + 3.0).toFixed(1));
      }
      return copy;
    });
  };

  const handleSequentialAlign = () => {
    setTurns(prev => {
      const copy = [...prev].sort((a, b) => a.start - b.start);
      let nextStart = 0;
      return copy.map(t => {
        const dur = Math.max(1, t.end - t.start);
        const currentStart = nextStart;
        nextStart = currentStart + dur + 0.5;
        return {
          ...t,
          start: parseFloat(currentStart.toFixed(1)),
          end: parseFloat((currentStart + dur).toFixed(1))
        };
      });
    });
  };

  const handleSave = () => {
    if (!profileName.trim()) {
      alert("Dialogue name is required.");
      return;
    }
    if (turns.length === 0) {
      alert("The dialogue must contain at least one speech turn segment.");
      return;
    }
    
    // Auto-sort turns chronologically for consistent timeline rendering
    const sortedTurns = [...turns].sort((a, b) => a.start - b.start);

    onSave({
      id: initialProfile.id,
      name: profileName,
      language,
      difficulty,
      description,
      audioDurationSecs: parseFloat(totalDuration.toFixed(1)),
      turns: sortedTurns,
      hasOverlays: overlaps.length > 0
    });
  };

  return (
    <div className="bg-white border-2 border-indigo-200/90 rounded-2xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-tight">Turn-by-Turn Dialogue Builder</h4>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Map conversation turns, timings, and custom overlaps</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Close Editor
        </button>
      </div>

      {/* Metadata Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-705">Dialogue Title / Label</label>
          <input 
            type="text"
            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            placeholder="e.g. Call Center Dispute"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-slate-705">Language Style Tag</label>
          <input 
            type="text"
            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            placeholder="e.g. Indonesian (Bilingual Slang)"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="font-semibold text-slate-705">Description Overview</label>
          <input 
            type="text"
            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            placeholder="Describe the speech pacing, noise, or speaker interaction style"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="font-semibold text-slate-750">Complexity Weight / Difficulty</label>
          <select 
            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
          >
            <option value="Easy">Easy (Clear, sequential corporate style)</option>
            <option value="Medium">Medium (Casual talk, some slang)</option>
            <option value="Hard">Hard (Disputes, crosstalk overlapping)</option>
          </select>
        </div>
      </div>

      {/* Timings and Builder Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Total Duration:</span>
            <span className="font-mono font-bold text-indigo-700">{totalDuration.toFixed(1)} secs</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Turns Count:</span>
            <span className="font-mono font-bold text-slate-700">{turns.length}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleSortTurns}
            className="py-1 px-2.5 border border-slate-200 hover:border-slate-300 bg-white rounded-lg text-[11px] font-medium text-slate-600 flex items-center gap-1 cursor-pointer transition-all"
            title="Sort turn timestamps chronologically"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-500" /> Sort Timestamps
          </button>
          
          <button 
            type="button"
            onClick={handleSequentialAlign}
            className="py-1 px-2.5 border border-slate-200 hover:border-slate-300 bg-white rounded-lg text-[11px] font-medium text-indigo-600 flex items-center gap-1 cursor-pointer transition-all"
            title="Auto adjust starts and ends to make them strictly sequential"
          >
            <RotateCcw className="w-3 h-3 text-indigo-500" /> Sequential Align
          </button>
        </div>
      </div>

      {/* Timing table */}
      <DialogueTimingTable 
        turns={turns}
        onUpdateTurn={handleUpdateTurn}
        onDeleteTurn={handleDeleteTurn}
        onSimulateOverlap={handleSimulateOverlap}
      />

      {/* Smart Overlap Diagnostics Area */}
      {overlaps.length > 0 ? (
        <div className="p-3 bg-amber-50/75 border border-amber-200/50 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>Target Overlapping Crosstalk Zones Found ({overlaps.length})</span>
          </div>
          <ul className="list-disc pl-5 text-[10px] text-amber-700 font-mono space-y-0.5">
            {overlaps.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/75 border border-emerald-200/50 rounded-xl flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] text-emerald-800 font-medium">No overlaps detected. Speakers speak strictly chronologically consecutively. Set timestamps to test overlap robustness.</span>
        </div>
      )}

      {/* Form Action Controls */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <button
          type="button"
          onClick={handleAddTurn}
          className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm text-[11px]"
        >
          <Plus className="w-4 h-4 text-emerald-400" /> Add Conversational Turn
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTurns(initialProfile.turns.map(t => ({ ...t })))}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg cursor-pointer transition-all animate-[fadeIn_0.2s_ease-out]"
          >
            Discard to Preset
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md animate-[fadeIn_0.2s_ease-out]"
          >
            <Save className="w-4 h-4 text-indigo-250 animate-pulse" /> Apply to Arena Battle
          </button>
        </div>
      </div>
    </div>
  );
}
