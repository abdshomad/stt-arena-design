export interface DialogueTurn {
  speaker: string;
  speakerId: number; // 0 or 1
  start: number; // seconds
  end: number; // seconds
  text: string;
}

export interface DialogueProfile {
  id: string;
  name: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  audioDurationSecs: number;
  turns: DialogueTurn[];
  hasOverlays: boolean;
}

export const DIALOGUE_PROFILES: DialogueProfile[] = [
  {
    id: 'customer_support_telco',
    name: '🇮🇩 Telco Fiber-Optic Complaint Line',
    language: 'Indonesian (Official & Colloquial)',
    difficulty: 'Hard',
    description: 'An irritated consumer reporting connection failure, repeatedly interrupting the call center agent.',
    audioDurationSecs: 14,
    hasOverlays: true,
    turns: [
      {
        speaker: 'Speaker 0 (Customer)',
        speakerId: 0,
        start: 0.0,
        end: 3.5,
        text: 'Halo IndiCare, ini koneksi wifi internet saya putus total ya dari pagi! Lampu LOS merah berkedip terus.'
      },
      {
        speaker: 'Speaker 1 (Agent)',
        speakerId: 1,
        start: 3.2,
        end: 6.8,
        text: 'Baik Pak, mohon maaf atas kendalanya. Boleh diinformasikan nomor pelanggan dan tipe modemnya?'
      },
      {
        speaker: 'Speaker 0 (Customer)',
        speakerId: 0,
        start: 6.2,
        end: 9.8,
        text: 'Aduh mba, nomor pelanggan saya nggak hafal! Tapi kemarin teknisi baru aja dateng pasang, masa rusak lagi sih?'
      },
      {
        speaker: 'Speaker 1 (Agent)',
        speakerId: 1,
        start: 9.5,
        end: 14.0,
        text: 'Kami memahami kekecewaan Bapak. Saya bantu cek koordinat lokasi perumahan Bapak di database operasional kami sebentar ya.'
      }
    ]
  },
  {
    id: 'jaksel_tech_talk',
    name: '🇮🇩 Menteng Startup Founders Chat',
    language: 'Indonesian / English Bilingual Slang',
    difficulty: 'Medium',
    description: 'A rapid code-switching business debate between tech founders with heavy Jakarta Slang ("Anak Jaksel").',
    audioDurationSecs: 12,
    hasOverlays: true,
    turns: [
      {
        speaker: 'Speaker 0 (Founder A)',
        speakerId: 0,
        start: 0.0,
        end: 3.2,
        text: 'So, menurut gue, scaling local STT model kayak Whisper-large itu sebenernya much more budget-friendly.'
      },
      {
        speaker: 'Speaker 1 (Founder B)',
        speakerId: 1,
        start: 2.8,
        end: 6.0,
        text: 'Wait, tapi literally lu harus maintenance GPU clusters sendiri kan? Egress cost-nya can be super pricey.'
      },
      {
        speaker: 'Speaker 0 (Founder A)',
        speakerId: 0,
        start: 5.8,
        end: 9.0,
        text: 'Ya sih, tapi dari sisi data privacy, it is definitely a huge win, very secure buat clients confidential.'
      },
      {
        speaker: 'Speaker 1 (Founder B)',
        speakerId: 1,
        start: 8.5,
        end: 12.0,
        text: 'I see your point, tapi honestly Deepgram API or ElevenLabs speed is just unbeatable, super responsive.'
      }
    ]
  },
  {
    id: 'financial_analyst_briefing',
    name: '🇬🇧 Wall Street Earnings Live Sync',
    language: 'English (Corporate)',
    difficulty: 'Easy',
    description: 'Professional financial analyst and portfolio partner reviewing quarterly yield targets and projections.',
    audioDurationSecs: 15,
    hasOverlays: false,
    turns: [
      {
        speaker: 'Speaker 0 (Analyst)',
        speakerId: 0,
        start: 0.0,
        end: 4.1,
        text: 'Welcome, everyone. Today we are examining our second quarter fiscal performance, highlighting a fourteen percent growth.'
      },
      {
        speaker: 'Speaker 1 (Partner)',
        speakerId: 1,
        start: 4.2,
        end: 7.8,
        text: 'Excellent summary, Sarah. Could you also clarify our net customer retention rate projections for the next half?'
      },
      {
        speaker: 'Speaker 0 (Analyst)',
        speakerId: 0,
        start: 8.0,
        end: 11.5,
        text: 'Certainly. We expect enterprise retention rates to hover robustly around ninety-six percent, supported by new automation.'
      },
      {
        speaker: 'Speaker 1 (Partner)',
        speakerId: 1,
        start: 11.6,
        end: 15.0,
        text: 'Fantastic. That gives us high confidence to execute our upcoming geographic expansion strategy as planned.'
      }
    ]
  }
];
