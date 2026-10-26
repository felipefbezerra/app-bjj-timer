import type { JanelaInfo } from './janela';

// Versão web (PWA): no computador (Chrome/Edge) usa o Document Picture-in-Picture;
// no celular, um vídeo gerado de um canvas. Mostra só o tempo e a posição.

const BG = '#111315', FG = '#f3f1ea';

type Doc = { type: 'doc'; win: Window };
type Vid = { type: 'video'; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; video: HTMLVideoElement };
let pip: Doc | Vid | null = null;
let last: JanelaInfo = { time: '', label: '', color: FG };
const listeners = new Set<(active: boolean) => void>();

const w = typeof window !== 'undefined' ? (window as Window & { documentPictureInPicture?: { requestWindow(o: { width: number; height: number }): Promise<Window> } }) : null;
const hasDoc = !!w && 'documentPictureInPicture' in w;
const hasVideo = !!w && !!document.pictureInPictureEnabled && 'captureStream' in HTMLCanvasElement.prototype;

function emit() { listeners.forEach(fn => fn(!!pip)); }

function draw() {
  if (!pip) return;
  const { time, label, color } = last;
  if (pip.type === 'doc') {
    const d = pip.win.document;
    const t = d.getElementById('t'), l = d.getElementById('l');
    if (t) { t.textContent = time; t.style.color = color; }
    if (l) l.textContent = label;
    return;
  }
  const { ctx, canvas } = pip, W = canvas.width, H = canvas.height;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fit = (text: string, size: number, y: number, fill: string) => {
    let sz = size;
    do { ctx.font = `600 ${sz}px Oswald_600SemiBold, Oswald, "Arial Narrow", sans-serif`; sz -= 2; } while (ctx.measureText(text).width > W - 30 && sz > 10);
    ctx.fillStyle = fill; ctx.fillText(text, W / 2, y);
  };
  fit(time, 150, H * 0.42, color);
  fit(label.toUpperCase(), 40, H * 0.82, FG);
}

function close() {
  if (!pip) return;
  try {
    if (pip.type === 'doc') pip.win.close();
    else { if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {}); pip.video.remove(); }
  } catch {}
  pip = null; emit();
}

async function open() {
  if (pip) { close(); return; }
  try {
    if (hasDoc && w?.documentPictureInPicture) {
      const win = await w.documentPictureInPicture.requestWindow({ width: 320, height: 200 });
      const d = win.document;
      // Leva as fontes do app (as @font-face já carregadas) para a janelinha.
      document.querySelectorAll('style').forEach(s => { if (s.textContent?.includes('@font-face')) d.head.appendChild(s.cloneNode(true)); });
      const css = d.createElement('style');
      css.textContent = `html,body{margin:0;height:100%}body{display:flex;flex-direction:column;align-items:center;justify-content:center;background:${BG};color:${FG};font-family:Oswald_600SemiBold,Oswald,"Arial Narrow",sans-serif;text-align:center;user-select:none}#t{font-size:34vw;line-height:1;font-variant-numeric:tabular-nums}#l{font-family:BarlowCondensed_700Bold,"Arial Narrow",sans-serif;font-size:10vw;text-transform:uppercase;letter-spacing:.06em;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}`;
      d.head.appendChild(css);
      d.body.innerHTML = '<div id="t"></div><div id="l"></div>';
      win.addEventListener('pagehide', () => { pip = null; emit(); });
      pip = { type: 'doc', win };
    } else if (hasVideo) {
      const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 270;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const video = document.createElement('video');
      video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
      video.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0;pointer-events:none';
      document.body.appendChild(video);
      pip = { type: 'video', canvas, ctx, video };
      draw();
      video.srcObject = (canvas as HTMLCanvasElement & { captureStream(): MediaStream }).captureStream();
      await video.play();
      video.addEventListener('leavepictureinpicture', () => { video.remove(); pip = null; emit(); });
      await video.requestPictureInPicture();
    }
  } catch {
    if (pip?.type === 'video') pip.video.remove();
    pip = null;
  }
  emit(); draw();
}

export const Janela = {
  inline: false,
  isSupported: () => hasDoc || hasVideo,
  isActive: () => !!pip,
  setAuto: (_on: boolean) => {},
  open: () => { open(); },
  close,
  update: (info: JanelaInfo) => { last = info; draw(); },
  onChange: (fn: (active: boolean) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
};
