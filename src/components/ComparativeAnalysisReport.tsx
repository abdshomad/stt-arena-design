import React, { useState } from 'react';
import { 
  Building, 
  Cloud, 
  Cpu, 
  TrendingUp, 
  Award, 
  Settings, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export const ComparativeAnalysisReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud' | 'finance' | 'recommend'>('local');

  return (
    <div id="stt-compare-consultation-center" className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden font-sans">
      
      {/* Top Banner and Navigation Bar */}
      <div className="bg-slate-50 border-b border-slate-100 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase leading-none tracking-wide">STT Implementation Blueprint</span>
            <h3 className="font-display font-bold text-slate-900 text-base mt-1.5">Local Deployments vs. Commercial Cloud SaaS STT</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Exposed comparative analysis auditing Word Error Rate (WER) metrics, hardware dependencies, setups, and financial break-even curves to direct enterprise scaling decisions.
            </p>
          </div>
          
          {/* Segmented Controller Tab Selector */}
          <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'local' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Local Whisper</span>
            </button>
            <button
              onClick={() => setActiveTab('cloud')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'cloud' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. Cloud SaaS</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'finance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. Financials</span>
            </button>
            <button
              onClick={() => setActiveTab('recommend')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'recommend' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>4. Recommendations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Contents */}
      <div className="p-6">
        
        {/* TAB 1: LOCAL OPTIONS */}
        {activeTab === 'local' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Cpu className="w-4.5 h-4.5 text-indigo-500" />
                  Self-Hosted Open-Source Deployments
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Local setups utilize advanced AI open-source weights (such as <b>Whisper</b>, <b>Faster-Whisper</b>, and <b>WhisperX</b>) compiled and run inside dedicated corporate networking layers or air-gapped physical clouds.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-indigo-605 block uppercase">⚙️ Setup Complexity: High</span>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Requires setting up Docker containers containing CUDA libraries, configuring NVIDIA Container Toolkits, and orchestrating worker queues using Redis/Celery or high-throughput Triton Inference Server layers.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-amber-605 block uppercase">🖥️ Hardware Requirements: Medium to High</span>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      To transcribing in real-time, nodes require modern graphic processors containing dedicated tensor VRAM. Whisper-Large-v3 needs 4.5GB VRAM (highly quantized) up to 10GB for FP16 precision. Recommended: L4 or A10G.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-emerald-650 block uppercase">🔒 Offline Viability: Perfect</span>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Completely offline. Audio feeds remain strictly within local firewall topologies. Unaffected by public network congestion or connection dropping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pros & Cons list */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex flex-col justify-between">
                <div>
                  <h5 className="text-[11px] font-mono font-bold uppercase tracking-wide text-slate-450 mb-3.5">Self-Hosted Architectural Tradeoffs</h5>
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="space-y-1.5">
                      <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>Core Benefits (Pros):</span>
                      </div>
                      <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                        <li><b>Zero Transcription Costs:</b> Avoid paying SaaS per-minute fees ($0.024/min adds up exponentially).</li>
                        <li><b>Sovereign Data Storage:</b> Compliant with HIPAA, GDPR, and localized banking secrecy codes.</li>
                        <li><b>Total Tuning Control:</b> Directly inject custom vocabularies, manipulate temperature limits, or specify custom prompt adapters.</li>
                      </ul>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 mt-3">
                      <div className="text-red-700 font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                        <span>Underlying Limitations (Cons):</span>
                      </div>
                      <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                        <li><b>Substantial Engineering Overhead:</b> Demands expert DevOps staffing to configure clustering, active monitoring, and cluster failover processes.</li>
                        <li><b>Static Hardware Limits:</b> Scale is capped by your physical cluster. Spikes will result in latency delays unless expensive cold GPU nodes are standing by.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-450 font-mono italic mt-4 pt-3 border-t border-slate-200/50">
                  ⚡ Recommendation: Deploy CTranslate2 accelerated bindings (faster-whisper) on NVIDIA L4 to squeeze out 4x processing speeds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLOUD SaaS OPTIONS */}
        {activeTab === 'cloud' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Google Cloud STT */}
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-150 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Google Cloud Speech-to-Text V2</h5>
                    <span className="text-[10px] text-slate-500">Tier-1 Public Cloud (Chirp & Chirp-2)</span>
                  </div>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded">GCP</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Pricing Model:</span>
                    <p className="font-bold text-slate-800">$0.024 per Minute ($1.44 / Hour)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Typical Latency:</span>
                    <p className="text-slate-700">80ms - 110ms (Superior real-time streaming endpoints)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Customization:</span>
                    <p className="text-slate-600 text-[11px]">Phrase hints, word boosting, dynamic vocab class tags.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Language Support:</span>
                    <p className="text-slate-650 text-[11px]">Outstanding. Supports 120+ languages with exceptional grasp on regional Indonesian dialects (Sundanese, Javanese, Balinese).</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Integration:</span>
                    <p className="text-slate-600 text-[11px]">Simple OAuth IAM structure with multi-platform SDKs.</p>
                  </div>
                </div>
              </div>

              {/* Amazon Transcribe */}
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-150 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Amazon Transcribe</h5>
                    <span className="text-[10px] text-slate-500">AWS Standard Pipeline</span>
                  </div>
                  <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 font-mono font-bold px-2 py-0.5 rounded">AWS</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Pricing Model:</span>
                    <p className="font-bold text-slate-800">$0.024 per Minute ($1.44 / Hour)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Typical Latency:</span>
                    <p className="text-slate-705">120ms - 155ms (Chunk-based HTTP/2 stream)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Customization:</span>
                    <p className="text-slate-600 text-[11px]">Custom dictionaries, vocab filtering sheets, custom language models (CLMs) on bulk training transcripts.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Language Support:</span>
                    <p className="text-slate-650 text-[11px]">Rich global catalog, automated multi-speaker language identification layers.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Integration:</span>
                    <p className="text-slate-600 text-[11px]">Standard client triggers; excels if tightly linked with AWS S3 storage buckets or Lambda functions.</p>
                  </div>
                </div>
              </div>

              {/* ElevenLabs STT */}
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-150 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">ElevenLabs Speech-to-Text</h5>
                    <span className="text-[10px] text-slate-500">Specialist LLM & Audio Cloud</span>
                  </div>
                  <span className="text-[10px] bg-pink-50 border border-pink-100 text-pink-700 font-mono font-bold px-2 py-0.5 rounded">ElevenLabs</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Pricing Model:</span>
                    <p className="font-bold text-slate-800">$12 / Hour equivalent base rates ($0.20/min)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Typical Latency:</span>
                    <p className="text-slate-705">180ms - 220ms (Excellent token stream speed)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Customization:</span>
                    <p className="text-slate-600 text-[11px]">High-context prompt structures and priming cues.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Language Support:</span>
                    <p className="text-slate-650 text-[11px]">Exceptional. Includes real-time translation layers on top of native dialect transcription (perfect Indonesian English slang decoding).</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Integration:</span>
                    <p className="text-slate-600 text-[11px]">Sleek rest post structures, outstanding documentation with few-line copy configurations.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: FINANCIALS */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h4 className="font-display font-semibold text-slate-900 text-sm">Financing Audit: Capital Expenditure (CAPEX) vs. Operational Costs (OPEX)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                <div className="space-y-3.5">
                  <h5 className="font-bold text-[11px] font-mono uppercase tracking-wider text-indigo-650 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Self-Hosted Capital Expense Model (CAPEX)
                  </h5>
                  <p className="text-slate-600 text-[11px]">
                    Requires upfront configuration of hardware nodes (either purchasing servers or signing fixed GPU cloud leases like RunPod/AWS L4/A10G).
                  </p>
                  <ul className="list-disc pl-4 text-slate-600 space-y-2 text-[11px]">
                    <li><b>Fixed Fixed Cost:</b> Leases for persistent L4 GPU hosting hover around <b>$0.35/hour</b> or ~<b>$250/month</b> per active node, irrespective of utilization.</li>
                    <li><b>Zero Volumetric Volatility:</b> You can process 1 hour or 50,000 hours of transcriptions on the same active node, and the cost remains capped at the monthly lease.</li>
                    <li><b>High Maintenance overheads:</b> Additional DevOps supervision and server administration allocation (~$300/node for engineering monitoring and load configuration packages).</li>
                  </ul>
                </div>

                <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-slate-200/70 pt-4 md:pt-0 md:pl-6">
                  <h5 className="font-bold text-[11px] font-mono uppercase tracking-wider text-emerald-650 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" /> Cloud Pay-As-You-Go Cost Model (OPEX)
                  </h5>
                  <p className="text-slate-600 text-[11px]">
                    Strictly consumption-based expenditure. Total bills scale directly as transcribing volume increases. Zero base overheads.
                  </p>
                  <ul className="list-disc pl-4 text-slate-600 space-y-2 text-[11px]">
                    <li><b>Direct Marginal Cost mapping:</b> Processing 1,000 hours of calling audio on GCP/AWS ($1.44/hour equivalent) bills exactly <b>$1,440/month</b>.</li>
                    <li><b>Infinite Scalability:</b> Spikes from 10 to 10,000 concurrent audio streams are automatically distributed and scaled in milliseconds without buying extra machines.</li>
                    <li><b>High Volume Pain-Point:</b> Call Centers receiving millions of calling minutes face enormous monthly SaaS bills that easily exceed physical GPU lease budgets by 800%+.</li>
                  </ul>
                </div>
              </div>

              {/* Economic Verdict banner */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3 mt-4 text-emerald-950">
                <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-xs">Financial Break-Even Cross-Over Verdict:</h6>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    If your operational transcription volume exceeds <b>1,500 Hours per Month</b> (approx. 90,000 minutes), self-hosting localized <b>Faster-Whisper</b> nodes becomes **highly profitable**, delivering over 70% cost savings compared to SaaS clouds. Below 1,500 hours, pay-as-you-go commercial APIs are financial champions.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: STAKEHOLDER RECOMMENDATIONS */}
        {activeTab === 'recommend' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recommendation 1: Real-time Agents */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase leading-none">Scenario A</span>
                  <h4 className="font-display font-extrabold text-slate-900 text-xs uppercase tracking-wide">Real-time Customer Support & Conversational Agents</h4>
                  
                  <div className="space-y-2.5 text-xs text-slate-600 mt-2">
                    <p className="leading-relaxed">
                      <b>Ideal Selection:</b> Cloud-based Speech APIs (preferably <b>ElevenLabs STT</b> or <b>Google Cloud STT Chirp</b>).
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><b>Indonesian Muffling Robustness:</b> Support interactions feature high colloquialisms (code-mixed "Anak Jaksel" slang, mumbled voices over bad micro-cellular structures). Specialty cloud APIs easily filter and correct these tokens out-of-the-box.</li>
                      <li><b>Ultra Low Latency Loops:</b> Voice AI feedback loops require sub-200ms latency to prevent conversations from feeling sluggish.</li>
                      <li><b>Zero Downtime Guarantee:</b> Eliminating self-hosted node failures guarantees continuous service availability during heavy operational spikes.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 mt-4 text-[11px] text-indigo-950">
                  <b>Implementation Tip:</b> Trigger the Deepgram or ElevenLabs WebSocket stream endpoints to pipe raw client-side PCM audio buffers, receiving word-by-word streaming transcript tokens.
                </div>
              </div>

              {/* Recommendation 2: Offline Enterprise Analytics */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-150 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase leading-none">Scenario B</span>
                  <h4 className="font-display font-extrabold text-slate-900 text-xs uppercase tracking-wide">Offline Enterprise Analytics & Compliance Archival</h4>
                  
                  <div className="space-y-2.5 text-xs text-slate-650 mt-2 font-normal">
                    <p className="leading-relaxed">
                      <b>Ideal Selection:</b> Local Deployment (<b>Faster-Whisper on NVIDIA L4 Cluster</b> using <code>cahya/faster-whisper-medium-id</code>).
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><b>Data Sovereignty & Legal Frameworks:</b> Archiving private enterprise customer calls (e.g. telecom data or bank transaction voice records) legally prohibits exposing files to third-party public clouds due to GDPR/HIPAA constraints.</li>
                      <li><b>Massive Catalog Volume:</b> Processing 20,000+ call hours/month is prohibitively billing on SaaS APIs ($28,000+/mo vs. $1,800 total hardware running cost on dedicated local nodes).</li>
                      <li><b>Diarization & Multi-Speaker Analysis:</b> Local WhisperX setups compute perfect localized offline word alignments and speaker diarization.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 mt-4 text-[11px] text-emerald-950">
                  <b>Implementation Tip:</b> Run Triton Inference server nodes with 8-bit quantized models to maximize throughput (process up to 240 words per second per single A10G host).
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
