import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Zap, Cpu, Award, Trash2, Globe, Shield, Activity, Sparkles } from 'lucide-react';
import { STTModel } from '../types';

interface CompareDockProps {
  pinnedModels: any[];
  onUnpin: (id: string) => void;
  onClearAll: () => void;
  onLaunchArena: (id: string, slot: 'A' | 'B') => void;
}

export const CompareDock: React.FC<CompareDockProps> = ({
  pinnedModels,
  onUnpin,
  onClearAll,
  onLaunchArena,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (pinnedModels.length === 0) return null;

  return (
    <>
      {/* Bottom Floating Pin Dock */}
      <div 
        id="compare-bottom-dock"
        className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-10px_25px_rgba(0,0,0,0.08)] transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left panel info */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-slate-900 text-xs uppercase tracking-wider">Fast Compare Engine</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Stacked <strong className="text-indigo-600 font-mono font-bold">{pinnedModels.length}</strong> of 4 target engines. Open side-by-side comparison matrix.
              </p>
            </div>
          </div>

          {/* Center pinned list */}
          <div className="flex-1 flex flex-wrap gap-2 justify-center max-w-2xl px-4">
            <AnimatePresence>
              {pinnedModels.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 ring-1 ring-slate-200 text-xs rounded-full shadow-xs"
                >
                  <span className="font-semibold text-slate-800 tracking-tight max-w-[120px] truncate">{m.name}</span>
                  <span className={`text-[9px] uppercase font-mono px-1 rounded ${m.isCloud ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-700'}`}>
                    {m.isCloud ? 'Cloud' : 'Local'}
                  </span>
                  <button
                    onClick={() => onUnpin(m.id)}
                    className="p-0.5 hover:bg-slate-200 rounded-full text-slate-450 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onClearAll}
              className="px-3.5 py-2 hover:bg-slate-50 text-slate-550 hover:text-slate-800 text-xs font-semibold rounded-xl border border-slate-205 transition-colors flex items-center justify-center gap-1 flex-1 md:flex-initial cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 flex-1 md:flex-initial cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Launch Comparison Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Matrix Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div 
            id="comparison-matrix-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-2 rounded-xl shadow-sm">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wide">Multi-Engine Benchmarking Matrix</h2>
                    <p className="text-[11px] text-slate-500">Cross-comparing deep parameter profiles, license terms, RTF speeds, and Indonesian regional capability.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Matrix Contents Table */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                  <table className="w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150">
                        <th className="py-3 px-4 font-mono font-semibold text-[10px] text-slate-400 uppercase w-48">Spec parameters</th>
                        {pinnedModels.map((m) => (
                          <th key={m.id} className="py-3 px-4 font-bold text-slate-900 border-l border-slate-100 min-w-[150px]">
                            <div className="flex flex-col">
                              <span className="font-display font-bold text-slate-850 text-xs sm:text-sm">{m.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium">{m.id}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Host Architecture / Provider */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40 font-sans">Platform & Source</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3 px-4 border-l border-slate-100">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${
                              m.isCloud ? 'bg-emerald-50 text-emerald-805 border-emerald-200' : 'bg-indigo-50 text-indigo-805 border-indigo-200'
                            }`}>
                              {m.isCloud ? 'Cloud SaaS API' : m.sourceType.replace('Local / ', '')}
                            </span>
                            {m.isCloud && <span className="text-[10px] text-slate-400 block mt-1">Provider: {m.company}</span>}
                          </td>
                        ))}
                      </tr>

                      {/* VRAM / HW Footprint */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40">Hardware Footprint</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3 px-4 border-l border-slate-100">
                            <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                              <Cpu className="w-3.5 h-3.5 text-slate-400" />
                              <span>{m.isCloud ? 'Serverless' : `${m.vramRequiredGb.toFixed(1)} GB VRAM`}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">CPU Viability: {m.cpuViability}</span>
                          </td>
                        ))}
                      </tr>

                      {/* License type */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40">Licensing Model</td>
                        {pinnedModels.map((m) => {
                          const isOpe = ['MIT', 'Apache-2.0', 'GPL-3.0'].includes(m.license);
                          return (
                            <td key={m.id} className="py-3 px-4 border-l border-slate-100 font-mono font-bold">
                              <div className="flex items-center gap-1.5">
                                <Shield className={`w-3.5 h-3.5 ${isOpe ? 'text-emerald-500' : 'text-amber-500'}`} />
                                <span className={isOpe ? 'text-emerald-700' : 'text-slate-800'}>{m.license}</span>
                              </div>
                              <span className="text-[10px] text-slate-450 font-sans font-normal mt-0.5 block">
                                {isOpe ? 'Open-source commercial ok' : m.license === 'Research-Only' ? 'Research terms apply' : 'Proprietary pay-per-use'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Throughput & RTF Speed */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40">RTF Speeds & Throughput</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3 px-4 border-l border-slate-100 font-mono">
                            <div className="flex items-center gap-1 text-slate-800 font-bold">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              <span>{m.throughputWordsPerSec} words/sec</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Mock Latency: {m.latencyMs}ms / 10s</span>
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded font-semibold mt-1 inline-block">
                              RTF Factor: {(m.latencyMs / 1000).toFixed(3)}s
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Indonesian Regional Capability */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40">Indonesian Regional Capability</td>
                        {pinnedModels.map((m) => {
                          const status = m.indonesiaSpecific 
                            ? 'Specialized Fine-Tu' 
                            : (m.indonesianSupport ? 'Excellent Support' : 'Not Supported');
                          return (
                            <td key={m.id} className="py-3 px-4 border-l border-slate-100 font-sans">
                              <div className="flex items-center gap-1.5">
                                <Globe className={`w-4 h-4 ${m.indonesianSupport ? 'text-emerald-500' : 'text-rose-500'}`} />
                                <strong className={m.indonesianSupport ? 'text-emerald-700' : 'text-rose-600'}>{status}</strong>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-[200px]">
                                {m.indonesiaSpecific 
                                  ? 'Custom fine-tuned dictionary mapped perfectly for regional Sundanese, Javanese and colloquial bilingual dialects.' 
                                  : m.indonesianSupport 
                                    ? 'Capable of core official Indonesian dialects. Highly reliable for standard news transcription.' 
                                    : 'Lacks language tokens for local Indonesian dialects.'}
                              </p>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Clean English WER */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40 font-mono">English Accuracy (WER)</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3 px-4 border-l border-slate-100 font-bold font-mono">
                            <span className="text-slate-800">{m.werEnglish.toFixed(1)}%</span>
                          </td>
                        ))}
                      </tr>

                      {/* Indonesian WER */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40 font-mono">Indonesian WER</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3 px-4 border-l border-slate-100 font-bold font-mono">
                            {m.werIndonesian === 99 ? (
                              <span className="text-rose-600">❌ Unsupported</span>
                            ) : (
                              <span className="text-teal-650">{m.werIndonesian.toFixed(1)}%</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Mumbled WER */}
                      <tr className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50/40 font-mono">Mumbled / Noisy WER</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3 px-4 border-l border-slate-100 font-bold font-mono text-slate-700">
                            {m.werMumbled.toFixed(1)}%
                          </td>
                        ))}
                      </tr>

                      {/* Action Triggers */}
                      <tr className="bg-slate-50/30">
                        <td className="py-3.5 px-4 font-semibold text-slate-700 bg-slate-50/40">Arena Workloads launches</td>
                        {pinnedModels.map((m) => (
                          <td key={m.id} className="py-3.5 px-4 border-l border-slate-100">
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => {
                                  onLaunchArena(m.id, 'A');
                                  setIsOpen(false);
                                }}
                                className="px-2.5 py-1 bg-slate-850 hover:bg-slate-950 text-white font-semibold text-[10px] rounded-lg text-center transition-all cursor-pointer"
                              >
                                Set as Model A in Arena
                              </button>
                              <button
                                onClick={() => {
                                  onLaunchArena(m.id, 'B');
                                  setIsOpen(false);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-[10px] rounded-lg text-center transition-all cursor-pointer"
                              >
                                Set as Model B in Arena
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-805 text-xs rounded-2xl border border-indigo-100/45 leading-relaxed font-sans shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <p>
                    <strong>Benchmarking Insight:</strong> Look for models displaying low **WER** combined with native **Indonesian Specialized** tuning or serverless options to maximize ROI on multi-branch production speech flows.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-955 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Close Matrix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
