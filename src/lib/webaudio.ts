// Um único AudioContext do navegador, para os bipes e o tom que mantém o treino vivo (só na versão web).
let ac: AudioContext | null = null;

export function audioContext() {
  if (typeof window === 'undefined') return null;
  if (!ac) {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) ac = new Ctor();
    } catch {}
  }
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}
