// Um único AudioContext do navegador, para os bipes e o tom que mantém o treino vivo (só na versão web).
let ac: AudioContext | null = null;

export function audioContext() {
  if (typeof window === 'undefined') return null;
  if (!ac) {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) { ac = new Ctor(); listen(); }
    } catch {}
  }
  wake();
  return ac;
}

// No iPhone uma ligação, a Siri ou um alarme pausa o áudio (estado "interrupted", não só "suspended").
// Ele volta quando o app reaparece na tela ou no próximo toque.
function wake() {
  const s = ac?.state as string | undefined;
  if (ac && s !== 'running' && s !== 'closed') ac.resume().catch(() => {});
}

function listen() {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  for (const ev of ['touchend', 'pointerdown', 'keydown']) window.addEventListener(ev, wake, { capture: true, passive: true });
}

// Modo de áudio do iPhone (Safari 16.4+). "ambient" mistura com a música de outros apps e fica mudo
// com a chave no silencioso; "playback" toca mesmo no silencioso, mas pausa a música de outros apps.
export function audioSession(type: 'ambient' | 'playback') {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) { try { nav.audioSession.type = type; } catch {} }
}

// iPhone e iPad (o iPad recente se apresenta como Mac, mas tem tela de toque).
export const isIOS = typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
