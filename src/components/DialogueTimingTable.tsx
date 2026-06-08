import React from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import { DialogueTurn } from '../data/dialogueData';

interface DialogueTimingTableProps {
  turns: DialogueTurn[];
  onUpdateTurn: (index: number, field: keyof DialogueTurn, value: any) => void;
  onDeleteTurn: (index: number) => void;
  onSimulateOverlap: (index: number) => void;
}

export function DialogueTimingTable({
  turns,
  onUpdateTurn,
  onDeleteTurn,
  onSimulateOverlap
}: DialogueTimingTableProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-[300px] overflow-y-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
            <th className="py-2.5 px-3 w-10 text-center">No</th>
            <th className="py-2.5 px-3 w-32">Speaker Choice</th>
            <th className="py-2.5 px-3 w-36">Time Window</th>
            <th className="py-2.5 px-3">Segment Transcription Text</th>
            <th className="py-2.5 px-3 w-28 text-center">Helper Tools</th>
            <th className="py-2.5 px-3 w-12 text-center">Del</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {turns.map((turn, index) => (
            <tr key={index} className="hover:bg-slate-50/50 transition-all font-sans">
              <td className="py-2 px-3 font-mono text-slate-400 text-center">{index + 1}</td>
              <td className="py-2 px-3">
                <select
                  className="w-full p-1.5 border border-slate-200 rounded bg-white text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={turn.speakerId}
                  onChange={(e) => onUpdateTurn(index, 'speakerId', parseInt(e.target.value))}
                >
                  <option value={0}>Speaker 0 (Customer)</option>
                  <option value={1}>Speaker 1 (Agent)</option>
                </select>
              </td>
              <td className="py-2 px-3">
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    className="w-14 p-1 border border-slate-200 rounded text-center text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={turn.start}
                    onChange={(e) => onUpdateTurn(index, 'start', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-slate-400 font-mono">-</span>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    className="w-14 p-1 border border-slate-200 rounded text-center text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={turn.end}
                    onChange={(e) => onUpdateTurn(index, 'end', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-slate-400 text-[10px]">s</span>
                </div>
              </td>
              <td className="py-2 px-3">
                <input 
                  type="text"
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={turn.text}
                  onChange={(e) => onUpdateTurn(index, 'text', e.target.value)}
                />
              </td>
              <td className="py-2 px-3 text-center">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSimulateOverlap(index)}
                    className="py-1 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold rounded flex items-center justify-center gap-0.5 mx-auto cursor-pointer transition-colors"
                    title="Force starting this turn before previous turn ends to simulate speaker overlapping"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Simulate Overlap
                  </button>
                ) : (
                  <span className="text-slate-300 italic text-[9px]">-</span>
                )}
              </td>
              <td className="py-2 px-3 text-center">
                <button
                  type="button"
                  onClick={() => onDeleteTurn(index)}
                  className="p-1 hover:text-red-500 text-slate-400 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
