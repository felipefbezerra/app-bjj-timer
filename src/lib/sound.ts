import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import type { SoundMode } from './store';

// Bipes curtos e voz que tocam junto com a música de outros apps (Spotify, YouTube) em vez de pausá-la.
// Um áudio mudo em loop mantém o app ativo em segundo plano durante o treino.

type Cue = 'tick' | 'work' | 'rest' | 'other' | 'done';
const SOURCES: Record<Cue | 'silence', number> = {
  tick: require('@/assets/sounds/tick.wav'),
  work: require('@/assets/sounds/work.wav'),
  rest: require('@/assets/sounds/rest.wav'),
  other: require('@/assets/sounds/other.wav'),
  done: require('@/assets/sounds/done.wav'),
  silence: require('@/assets/sounds/silence.wav'),
};

let players: Partial<Record<Cue | 'silence', AudioPlayer>> = {};
let configured = false;

async function ensure() {
  if (configured) return;
  configured = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
  } catch {}
  (Object.keys(SOURCES) as (Cue | 'silence')[]).forEach(k => { players[k] = createAudioPlayer(SOURCES[k]); });
  if (players.silence) players.silence.loop = true;
}

export const Sound = {
  async start() {
    await ensure();
    try { players.silence?.play(); } catch {}
  },
  stop() {
    try { players.silence?.pause(); } catch {}
    Speech.stop();
  },
  cue(c: Cue, mode: SoundMode) {
    if (mode === 'mute') return;
    const p = players[c];
    if (!p) return;
    p.seekTo(0).then(() => p.play()).catch(() => {});
  },
  say(text: string, mode: SoundMode) {
    if (mode !== 'voice' || !text) return;
    Speech.stop();
    // "Oss" escrito como se fala, para o leitor não soletrar.
    Speech.speak(text.replace(/\boss\b/gi, 'Ôs'), { language: 'pt-BR', rate: 1.05, useApplicationAudioSession: false });
  },
};
