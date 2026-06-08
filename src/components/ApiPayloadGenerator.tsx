import React, { useState } from 'react';
import { Terminal, Copy, Check, SlidersHorizontal, Key, Eye, EyeOff, Sparkles, Sliders } from 'lucide-react';

export const ApiPayloadGenerator: React.FC = () => {
  // Configuration State Node
  const [apiKey, setApiKey] = useState('stt_live_sk_89fca82d921e');
  const [showKey, setShowKey] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(500);
  const [vocabBoost, setVocabBoost] = useState('Anak Jaksel, jujurly, Santai');
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'node' | 'go'>('python');
  const [copied, setCopied] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:3000/api/transcribe');

  React.useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        const origin = window.location.origin;
        setGatewayUrl(`${origin}/api/transcribe`);
      })
      .catch(() => {
        // Fallback relative 
        setGatewayUrl(`${window.location.origin}/api/transcribe`);
      });
  }, []);

  // Formatted Array from tags
  const vocabTags = vocabBoost.split(',').map(s => s.trim()).filter(Boolean);

  // Draft the dynamic templates
  const pyCode = `import requests

url = "${gatewayUrl}"
headers = {
    "Authorization": "Bearer ${apiKey}"
}
payload = {
    "model": "faster-whisper-medium-id",
    "temperature": ${temperature},
    "max_tokens_per_chunk": ${maxTokens},
    "vocabulary_boost": [${vocabTags.map(v => `"${v}"`).join(', ')}]
}
files = {
    "file": open("audio.wav", "rb")
}

response = requests.post(url, headers=headers, data=payload, files=files)
print(response.json())`;

  const nodeCode = `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('audio.wav'));
form.append('model', 'faster-whisper-medium-id');
form.append('temperature', '${temperature}');
form.append('max_tokens_per_chunk', '${maxTokens}');
form.append('vocabulary_boost', JSON.stringify([${vocabTags.map(v => `"${v}"`).join(', ')}]));

axios.post('${gatewayUrl}', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer ${apiKey}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`;

  const goCode = `package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	url := "${gatewayUrl}"
	
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	// Set dynamic payloads
	writer.WriteField("model", "faster-whisper-medium-id")
	writer.WriteField("temperature", "${temperature}")
	writer.WriteField("max_tokens_per_chunk", "${maxTokens}")
	writer.WriteField("vocabulary_boost", \`[${vocabTags.map(v => `"${v}"`).join(', ')}]\`)
	
	file, err := os.Open("audio.wav")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	part, _ := writer.CreateFormFile("file", "audio.wav")
	io.Copy(part, file)
	writer.Close()

	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer ${apiKey}")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}`;

  const activeCodeText = activeCodeTab === 'python' ? pyCode : activeCodeTab === 'node' ? nodeCode : goCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="live-payload-configurator" className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          Live API Payload Snippet Generator & Client Configurator
        </h4>
        <p className="text-xs text-slate-500">
          Modify the dynamic client variables below in real-time. Updating these fields propagates immediate token parameters directly inside correct Python, Node.js, and Golang integration boilerplate examples.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls block */}
        <div className="lg:col-span-1 bg-slate-50/60 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Runtime Connection Credentials</span>
            
            {/* API Key */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Key className="w-3 h-3 text-slate-400" /> API Authentication Token
              </label>
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="stt_live_sk_..."
                  className="w-full pr-8 pl-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Vocab boost */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Specialized Vocabulary Boost
              </label>
              <input 
                type="text" 
                value={vocabBoost}
                onChange={(e) => setVocabBoost(e.target.value)}
                placeholder="Term 1, Term 2, Slang terms"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <span className="text-[9px] text-slate-400 leading-tight block">Comma separated list of slang words or specialized acoustic terms models should prioritize.</span>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  🌡️ Decoding Temperature
                </span>
                <span className="font-mono text-indigo-600 font-bold">{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[9px] text-slate-400 leading-tight block">Lower temperature leads to highly consistent literal transcripts; higher temperature is conversational.</span>
            </div>

            {/* Max chunk token size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  📦 Max Tokens Per Chunk
                </span>
                <span className="font-mono text-indigo-600 font-bold">{maxTokens} tkns</span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="2000" 
                step="50"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[9px] text-slate-400 leading-tight block">Restricts maximum phrase context boundaries to match storage limits.</span>
            </div>

          </div>

          <div className="border-t border-slate-200/50 pt-2 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
            <Sliders className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Updates execute synchronously</span>
          </div>
        </div>

        {/* Snippet display section */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-lg min-h-[300px]">
          {/* Header row tabs */}
          <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-850">
            <div className="flex gap-1.5">
              <button 
                onClick={() => setActiveCodeTab('python')}
                className={`px-3 py-1 text-xs font-mono rounded-md font-semibold cursor-pointer transition-all ${
                  activeCodeTab === 'python' ? 'bg-slate-80s bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python Payload
              </button>
              <button 
                onClick={() => setActiveCodeTab('node')}
                className={`px-3 py-1 text-xs font-mono rounded-md font-semibold cursor-pointer transition-all ${
                  activeCodeTab === 'node' ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Node.js Axios
              </button>
              <button 
                onClick={() => setActiveCodeTab('go')}
                className={`px-3 py-1 text-xs font-mono rounded-md font-semibold cursor-pointer transition-all ${
                  activeCodeTab === 'go' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Go (Golang) REST
              </button>
            </div>

            <button 
              onClick={handleCopy}
              className="p-1 px-2.5 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-350 transition-all flex items-center gap-1.5 border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied Payload!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Core code block */}
          <div className="p-4 flex-1 overflow-auto bg-slate-950/40">
            <pre className="text-[10px] font-mono text-slate-200 leading-relaxed overflow-x-auto select-all">
              {activeCodeText}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
