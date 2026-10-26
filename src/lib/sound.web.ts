import type { SoundMode } from './store';
import { audioContext, audioSession, isIOS } from './webaudio';

// Versão web (PWA): bipes pelo Web Audio e voz pelo leitor do próprio aparelho.
// Diferente de um <audio>, o Web Audio não toma o foco de áudio do celular:
// Spotify e YouTube continuam tocando junto.

type Cue = 'tick' | 'work' | 'rest' | 'other' | 'done';

function beep(freq: number, dur: number, count = 1, gap = 0.12) {
  const a = audioContext();
  if (!a) return;
  for (let i = 0; i < count; i++) {
    const t = a.currentTime + i * (dur + gap);
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
}

const CUES: Record<Cue, () => void> = {
  tick: () => beep(880, 0.12),
  work: () => beep(1320, 0.5),
  rest: () => beep(520, 0.25, 3, 0.1),
  other: () => beep(760, 0.35),
  done: () => beep(1040, 0.3, 4, 0.12),
};

const tts = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
let voice: SpeechSynthesisVoice | null = null;
function pickVoice() {
  if (!tts) return;
  const vs = tts.getVoices();
  voice = vs.find(v => /^pt[-_]BR/i.test(v.lang)) ?? vs.find(v => /^pt/i.test(v.lang)) ?? null;
}
if (tts) { pickVoice(); tts.addEventListener?.('voiceschanged', pickVoice); }

let silentPlay = false;

export const Sound = {
  // Só no iPhone a chave do silencioso cala o app web; o app instalado da loja já toca nela.
  hasSilentSwitch: isIOS,
  setSilentPlay(on: boolean) { silentPlay = on; audioSession(on ? 'playback' : 'ambient'); },
  // Chamado no toque de "Começar": o navegador só libera som e voz a partir de um toque.
  prime() {
    audioContext();
    try { if (tts) { tts.cancel(); tts.speak(new SpeechSynthesisUtterance('')); } } catch {}
  },
  async start() { audioContext(); },
  stop() {
    try { tts?.cancel(); } catch {}
    // Fora do treino, volta a misturar com a música de outros apps.
    if (silentPlay) audioSession('ambient');
  },
  cue(c: Cue, mode: SoundMode) {
    if (mode === 'mute') return;
    CUES[c]();
  },
  say(text: string, mode: SoundMode) {
    if (mode !== 'voice' || !text || !tts) return;
    try {
      tts.cancel();
      // "Oss" escrito como se fala, para o leitor não soletrar.
      const u = new SpeechSynthesisUtterance(text.replace(/\boss\b/gi, 'Ôs'));
      u.lang = 'pt-BR'; if (voice) u.voice = voice; u.rate = 1.05;
      tts.speak(u);
    } catch {}
  },
};
