/**
 * Generates simulated speech translations and transcription tokens
 * depending on selected target audio duration and dialect presets.
 */
export function generateSimulatedTranscript(duration: number, lang: string): string {
  const wordsEng = [
    "realtime", "speech", "decoding", "active", "on", "the", "client", "using", 
    "ctranslate", "whisper", "model", "benchmarks", "for", "latency", "and", "accuracy",
    "evaluation", "within", "the", "stt", "arena", "playground", "infrastructure",
    "maximizing", "throughput", "with", "optimized", "sub-second", "VAD", "pipelines"
  ];
  const wordsId = [
    "transkripsi", "suara", "kustom", "berhasil", "dipetakan", "secara", "realtime",
    "oleh", "mesin", "stt", "arena", "menggunakan", "algoritma", "lokal", "tanpa",
    "memotong", "bagian", "overlapping", "dialog", "sehingga", "hasilnya", "akurat"
  ];
  const wordsMixed = [
    "nyobain", "deploy", "custom", "audio", "di", "stt", "arena", "secara", "realtime",
    "hasilnya", "literally", "epic", "banget", "tanpa", "latency", "tinggi", "jadi",
    "bisa", "improve", "accuracy", "dari", "local", "whisper", "secara", "significant"
  ];

  let pool = wordsEng;
  if (lang.includes("Indonesian")) pool = wordsId;
  else if (lang.includes("Mixed") || lang.includes("Multilingual")) pool = wordsMixed;

  const approximateWordCount = Math.max(5, Math.round(duration * 2.3)); // 2.3 words per second
  const result: string[] = [];
  for (let i = 0; i < approximateWordCount; i++) {
    result.push(pool[i % pool.length]);
  }
  return result.join(" ");
}
