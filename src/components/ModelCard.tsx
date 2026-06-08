import React, { useState } from 'react';
import { ManagedModel, GPUModel } from '../types/gpu';
import { Cpu, HardDrive, Zap, Tag, HelpCircle, Check, Loader2, ArrowRight } from 'lucide-react';

interface ModelCardProps {
  model: ManagedModel;
  gpus: GPUModel[];
  onLoadModel: (modelId: string, gpuId: string) => void;
  onUnloadModel: (modelId: string) => void;
  onMoveModel: (modelId: string, targetGpuId: string) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  gpus,
  onLoadModel,
  onUnloadModel,
  onMoveModel,
}) => {
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  // Find where the model is currently loaded
  const currentGpu = gpus.find((g) => g.id === model.gpuId);

  return (
    <div
      id={`model-card-${model.id}`}
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden ${
        model.status === 'loaded'
          ? 'border-indigo-200 bg-indigo-50/10'
          : model.status === 'loading'
          ? 'border-amber-200 bg-amber-50/10 animate-pulse'
          : 'border-slate-250/70 hover:border-slate-300'
      }`}
    >
      {/* Decorative top strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          model.status === 'loaded'
            ? 'bg-indigo-600'
            : model.status === 'loading'
            ? 'bg-amber-500'
            : 'bg-slate-300/80'
        }`}
      />

      {/* Card Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-sm tracking-tight leading-tight">
              {model.name}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">ID: {model.id}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap ${
              model.status === 'loaded'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : model.status === 'loading'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {model.status.toUpperCase()}
          </span>
        </div>

        {/* Specs Table */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] font-mono text-slate-600">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Size: <strong className="text-slate-800">{model.sizeGb.toFixed(1)} GB</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Params: <strong className="text-slate-800">{model.parameters}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 border-t border-slate-200/60 pt-1 mt-1">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span>Format: <strong className="text-slate-800">{model.format}</strong></span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {model.description}
        </p>

        {/* Capabilities Badge List */}
        <div className="flex flex-wrap gap-1 pt-1">
          {model.capabilities.map((cap, i) => (
            <span
              key={i}
              className="bg-slate-100 text-[10px] px-2 py-0.5 rounded-md font-sans text-slate-605 border border-slate-200/50 flex items-center gap-1"
            >
              <Tag className="w-2.5 h-2.5 text-indigo-400" />
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer / Controls */}
      <div className="mt-4 pt-4 border-t border-slate-100/80 relative">
        {model.status === 'unloaded' && (
          <div className="relative">
            <button
              onClick={() => {
                setShowLoadDropdown(!showLoadDropdown);
                setShowMoveDropdown(false);
              }}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span>Load Model onto GPU</span>
            </button>

            {showLoadDropdown && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Destination GPU
                </div>
                {gpus.map((gpu) => {
                  const hasSpace = gpu.vramTotalGb - gpu.vramUsedGb >= model.sizeGb;
                  return (
                    <button
                      key={gpu.id}
                      disabled={!hasSpace}
                      onClick={() => {
                        onLoadModel(model.id, gpu.id);
                        setShowLoadDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors cursor-pointer ${
                        hasSpace
                          ? 'hover:bg-slate-50 text-slate-700'
                          : 'bg-slate-50/50 text-slate-350 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-medium">
                        {gpu.name}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Free: {(gpu.vramTotalGb - gpu.vramUsedGb).toFixed(1)} GB
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold">
                        {gpu.vramTotalGb - gpu.vramUsedGb >= model.sizeGb ? (
                          <span className="text-emerald-600">{model.sizeGb.toFixed(1)} GB Req.</span>
                        ) : (
                          <span className="text-rose-500 font-bold">Insufficient VRAM</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {model.status === 'loading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-mono text-amber-700">
              <span className="flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Orchestrating...
              </span>
              <span className="font-bold">{model.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-150"
                style={{ width: `${model.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {model.status === 'loaded' && currentGpu && (
          <div className="space-y-3">
            <div className="bg-indigo-50/60 border border-indigo-100/50 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="text-indigo-805 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                Loaded on {currentGpu.name}
              </span>
            </div>

            <div className="flex gap-2">
              {/* Move Model button */}
              <div className="relative flex-1">
                <button
                  onClick={() => {
                    setShowMoveDropdown(!showMoveDropdown);
                    setShowLoadDropdown(false);
                  }}
                  className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Move GPU</span>
                </button>

                {showMoveDropdown && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                    <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Move onto another GPU
                    </div>
                    {gpus
                      .filter((g) => g.id !== model.gpuId)
                      .map((gpu) => {
                        const hasSpace = gpu.vramTotalGb - gpu.vramUsedGb >= model.sizeGb;
                        return (
                          <button
                            key={gpu.id}
                            disabled={!hasSpace}
                            onClick={() => {
                              onMoveModel(model.id, gpu.id);
                              setShowMoveDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors cursor-pointer ${
                              hasSpace
                                ? 'hover:bg-slate-50 text-slate-700'
                                : 'bg-slate-50/50 text-slate-350 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-medium">
                              {gpu.name}
                              <span className="text-[10px] text-slate-400 block font-normal text-slate-450">
                                Free: {(gpu.vramTotalGb - gpu.vramUsedGb).toFixed(1)} GB
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold">
                              {gpu.vramTotalGb - gpu.vramUsedGb >= model.sizeGb ? (
                                <span className="text-emerald-600">Available</span>
                              ) : (
                                <span className="text-rose-500 font-bold">No Space</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Unload button */}
              <button
                onClick={() => onUnloadModel(model.id)}
                className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 font-medium rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>Unload</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
