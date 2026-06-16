import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Send, 
  Code, 
  Copy, 
  Check, 
  Lock, 
  Globe, 
  Database,
  RefreshCw,
  HelpCircle,
  FileJson
} from 'lucide-react';

export const ApiSandbox: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<'GET_MODELS' | 'GET_SINGLE' | 'POST_TRANSCRIBE' | 'GET_COMPARE'>('GET_MODELS');
  const [apiKey, setApiKey] = useState('stt_live_sk_89fca82d921e');
  const [modelId, setModelId] = useState('faster-whisper');
  const [transcribeText, setTranscribeText] = useState('Selamat siang, jujurly saya mau complain soal sinyal internet telco di area BSD.');
  const [language, setLanguage] = useState('Indonesian');
  const [isMumbled, setIsMumbled] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [vocabBoost, setVocabBoost] = useState<string>('BSD, internet, jujurly');
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<any>(null);
  const [requestTimeMs, setRequestTimeMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-run GET_MODELS on mount
  useEffect(() => {
    handleExecute();
  }, [selectedMethod]);

  const handleExecute = async () => {
    setIsLoading(true);
    const startTime = performance.now();
    try {
      let endpoint = '/api/v1/models';
      let options: RequestInit = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      };

      if (selectedMethod === 'GET_SINGLE') {
        endpoint = `/api/v1/models/${modelId}`;
      } else if (selectedMethod === 'GET_COMPARE') {
        endpoint = '/api/v1/reports/compare';
      } else if (selectedMethod === 'POST_TRANSCRIBE') {
        endpoint = '/api/v1/transcribe';
        options = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            modelId,
            text: transcribeText,
            language,
            isMumbled,
            temperature,
            vocabBoost: vocabBoost ? vocabBoost.split(',').map(s => s.trim()).filter(Boolean) : []
          })
        };
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      setRequestTimeMs(Math.round(performance.now() - startTime));
      setApiResponse(data);
      setResponseHeaders({
        'content-type': res.headers.get('content-type') || 'application/json; charset=utf-8',
        'status': `${res.status} ${res.statusText}`,
        'x-powered-by': 'Express / STT-Gateway'
      });
    } catch (err: any) {
      setApiResponse({ error: err.message || 'Connection failure' });
      setResponseHeaders({ status: '500 Error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="rest-developer-sandbox" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="bg-slate-950 py-3.5 px-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="font-display font-medium text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Terminal className="text-indigo-400 w-4.5 h-4.5" />
            Speech-to-Text Model Arena v1 REST API Playground & Sandbox
          </h4>
          <span className="text-[10px] text-slate-400 block mt-0.5">Test real API interactions and inspect latency footprints instantly</span>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] text-emerald-450 font-mono font-bold uppercase shrink-0">API Gateway Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left column - Select endpoint and set parameters (5 cols) */}
        <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-slate-800/80 space-y-4">
          
          {/* Endpoint Choice */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wide text-indigo-300">HTTP REST Endpoint Method</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setSelectedMethod('GET_MODELS')}
                className={`py-2 px-2.5 rounded-lg text-left text-[11px] font-mono leading-tight transition-all border cursor-pointer ${
                  selectedMethod === 'GET_MODELS'
                    ? 'bg-slate-800 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/20 text-slate-400'
                }`}
              >
                <span className="text-emerald-410 font-bold mr-1">GET</span>/models
              </button>
              
              <button
                onClick={() => setSelectedMethod('GET_SINGLE')}
                className={`py-2 px-2.5 rounded-lg text-left text-[11px] font-mono leading-tight transition-all border cursor-pointer ${
                  selectedMethod === 'GET_SINGLE'
                    ? 'bg-slate-800 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/20 text-slate-400'
                }`}
              >
                <span className="text-emerald-410 font-bold mr-1">GET</span>/models/:id
              </button>

              <button
                onClick={() => setSelectedMethod('POST_TRANSCRIBE')}
                className={`py-2 px-2.5 rounded-lg text-left text-[11px] font-mono leading-tight transition-all border cursor-pointer ${
                  selectedMethod === 'POST_TRANSCRIBE'
                    ? 'bg-slate-800 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/20 text-slate-400'
                }`}
              >
                <span className="text-amber-410 font-bold mr-1">POST</span>/transcribe
              </button>

              <button
                onClick={() => setSelectedMethod('GET_COMPARE')}
                className={`py-2 px-2.5 rounded-lg text-left text-[11px] font-mono leading-tight transition-all border cursor-pointer ${
                  selectedMethod === 'GET_COMPARE'
                    ? 'bg-slate-800 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/20 text-slate-400'
                }`}
              >
                <span className="text-emerald-410 font-bold mr-1">GET</span>/reports/compare
              </button>
            </div>
          </div>

          {/* Setup parameters */}
          <div className="space-y-3.5 pt-3 border-t border-slate-800/50">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-indigo-300 block">HTTP Header & Payload Parameters</span>
            
            {/* Bearer Token */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-350 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> authorization Header
              </label>
              <input 
                type="text"
                value={`Bearer ${apiKey}`}
                onChange={(e) => setApiKey(e.target.value.replace('Bearer ', ''))}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono py-1.5 px-3 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Model ID Selection (for Single and Transcribe) */}
            {(selectedMethod === 'GET_SINGLE' || selectedMethod === 'POST_TRANSCRIBE') && (
              <div className="space-y-1">
                <label className="text-[10.5px] font-semibold text-slate-350">payload: modelId</label>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="faster-whisper">faster-whisper (Local)</option>
                  <option value="cahya-faster-whisper-medium-id">cahya-whisper-medium-id (Local)</option>
                  <option value="whisper.cpp">whisper.cpp (Local)</option>
                  <option value="gcp-stt">Google Cloud Speech-to-Text (Cloud)</option>
                  <option value="elevenlabs-stt">ElevenLabs Speech-to-Text (Cloud)</option>
                  <option value="deepgram-nova-2">Deepgram Nova-2 (Cloud)</option>
                </select>
              </div>
            )}

            {/* Transcribe Options (only for POST transcribe) */}
            {selectedMethod === 'POST_TRANSCRIBE' && (
              <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-slate-300">
                
                {/* Text String */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">payload: text (string)</label>
                  <textarea
                    value={transcribeText}
                    onChange={(e) => setTranscribeText(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[11px] py-1 px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>

                {/* Grid for language and mumbling */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400">language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[10.5px] py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Indonesian">Indonesian</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400">isMumbled</label>
                    <select
                      value={isMumbled ? 'true' : 'false'}
                      onChange={(e) => setIsMumbled(e.target.value === 'true')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[10.5px] py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-550 text-amber-400"
                    >
                      <option value="true">⚠️ True (Mumbled)</option>
                      <option value="false">Clear Speech</option>
                    </select>
                  </div>
                </div>

                {/* Vocab boost terms */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">vocabBoost (comma-separated)</label>
                  <input
                    type="text"
                    value={vocabBoost}
                    onChange={(e) => setVocabBoost(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg text-[10.5px] py-1 px-2 text-indigo-300 font-mono"
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>temperature</span>
                    <span className="text-indigo-400 font-bold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg transition-all cursor-pointer border border-indigo-500/10 mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing API Request...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Execute API Call</span>
              </>
            )}
          </button>
        </div>

        {/* Right column - Response Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 p-5 flex flex-col justify-between min-h-[380px] lg:min-h-0">
          
          <div className="space-y-3.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-450 flex items-center gap-1">
                <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                HTTP response Inspector
              </span>
              <div className="flex items-center gap-2">
                {requestTimeMs !== null && (
                  <span className="text-[10.5px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-2 py-0.5 rounded leading-none shrink-0">
                    ⏱️ {requestTimeMs}ms
                  </span>
                )}
                <button
                  onClick={copyToClipboard}
                  disabled={!apiResponse}
                  className="p-1 px-2.5 bg-slate-900 hover:bg-slate-830 text-slate-400 hover:text-slate-200 rounded font-mono text-[10px] transition-all flex items-center gap-1 cursor-pointer border border-slate-800"
                  title="Copy full JSON payload to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Response Headers */}
            {responseHeaders && (
              <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-900 text-[10px] font-mono text-slate-400 space-y-0.5">
                <div className="text-slate-500 uppercase font-bold text-[8.5px] border-b border-slate-800 pb-0.5 mb-1 shrink-0">response-headers</div>
                <div className="flex">
                  <span className="w-24 text-slate-500 shrink-0">Status:</span>
                  <span className={responseHeaders.status.startsWith('200') ? 'text-emerald-400 font-bold' : 'text-red-400'}>{responseHeaders.status}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500 shrink-0">Content-Type:</span>
                  <span className="text-slate-350">{responseHeaders['content-type']}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500 shrink-0">Server Gateway:</span>
                  <span className="text-slate-350">{responseHeaders['x-powered-by']}</span>
                </div>
              </div>
            )}

            {/* Code Response Block */}
            <div className="flex-1 min-h-[220px] bg-slate-900/30 border border-slate-900 text-slate-300 rounded-xl overflow-auto p-4 font-mono text-[10.5px] select-all leading-relaxed max-h-[300px]">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Fetching programmatic response, please wait...</span>
                </div>
              ) : apiResponse ? (
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 font-sans text-xs">
                  <HelpCircle className="w-4.5 h-4.5 text-slate-700 mr-1.5" />
                  Select parameters and click "Execute API Call" to dispatch
                </div>
              )}
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
};
