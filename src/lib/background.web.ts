import type { BgInfo } from './background';
import { audioContext } from './webaudio';

// Versão web (PWA): um tom grave e baixíssimo, que ninguém escuta, faz o navegador tratar o treino
// como áudio tocando, então o relógio, os bipes e a voz seguem com o app em segundo plano.
// O modo de áudio do iPhone (com ou sem som no silencioso) é escolhido em Sound.setSilentPlay.

let hum: OscillatorNode | null = null;

export const Background = {
  async start(_info: BgInfo) {
    const a = audioContext();
    if (!a || hum) return;
    try {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 25; g.gain.value = 0.002;
      o.connect(g).connect(a.destination); o.start();
      hum = o;
    } catch {}
  },
  update(_info: BgInfo) {},
  async stop() {
    try { hum?.stop(); } catch {}
    hum = null;
  },
};
