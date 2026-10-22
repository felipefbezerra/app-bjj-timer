import AsyncStorage from '@react-native-async-storage/async-storage';

import { type Mode, type Phase } from './sequence';

// Estado de um treino em andamento. O relógio usa a hora real (Date.now), então se o celular
// congelar o app em segundo plano o tempo é descontado certo quando ele volta.
export type Run = {
  mode: Mode;
  label: string;
  seq: Phase[];
  i: number;
  paused: boolean;
  finished: boolean;
  remaining: number;   // segundos restantes da fase atual (vale quando pausado)
  endAt: number;       // hora em que a fase atual termina (vale quando rodando)
  lastNow: number;
  startedAt: number;
  work: number;        // segundos de luta/exercício feitos
  rounds: number;
  done: string[];      // temas concluídos
  counted: number[];   // índices de fases de trabalho já contadas
  lastTick: number | null;
  w30: boolean;
  w10: boolean;
};

export type RunEvent =
  | { kind: 'phase'; sound: boolean }
  | { kind: 'tick' }
  | { kind: 'warn'; text: string }
  | { kind: 'finish' };

const KEY = 'bjj.run.v1';

// Treino a ser aberto pela tela de luta (novo ou retomado).
let pending: Run | null = null;
export function setPendingRun(r: Run) { pending = r; }
export function peekPendingRun() { return pending; }
export function clearPendingRun(r: Run) { if (pending === r) pending = null; }

export function newRun(mode: Mode, label: string, seq: Phase[]): Run {
  const now = Date.now();
  return { mode, label, seq, i: 0, paused: false, finished: false, remaining: seq[0].dur, endAt: now + seq[0].dur * 1000,
    lastNow: now, startedAt: now, work: 0, rounds: 0, done: [], counted: [], lastTick: null, w30: false, w10: false };
}

function countRound(r: Run, full: boolean) {
  const s = r.seq[r.i];
  if (s.type !== 'work' || r.counted.includes(r.i)) return;
  if (full || s.dur - r.remaining >= s.dur / 2) {
    r.counted.push(r.i); r.rounds++;
    if (s.theme && !r.done.includes(s.theme)) r.done.push(s.theme);
  }
}

// Avança o relógio e devolve o que aconteceu (para tocar bipes, falar e vibrar).
export function step(r: Run, now = Date.now()): RunEvent[] {
  const ev: RunEvent[] = [];
  if (r.paused || r.finished) { r.lastNow = now; return ev; }
  const dt = Math.min(600, (now - r.lastNow) / 1000);
  if (r.seq[r.i].type === 'work') r.work += dt;
  r.lastNow = now;
  r.remaining = (r.endAt - now) / 1000;
  const cur = r.seq[r.i];
  const whole = Math.ceil(r.remaining);
  if (whole <= 3 && whole >= 1 && r.lastTick !== whole && cur.dur > 3) { r.lastTick = whole; ev.push({ kind: 'tick' }); }
  if (cur.type === 'work' && !r.w30 && r.remaining <= 30 && r.remaining > 3) { r.w30 = true; if (cur.dur >= 60 && r.remaining > 28) ev.push({ kind: 'warn', text: 'Trinta segundos' }); }
  if (cur.type === 'work' && !r.w10 && r.remaining <= 10 && r.remaining > 3) { r.w10 = true; if (cur.dur >= 25 && r.remaining > 8) ev.push({ kind: 'warn', text: 'Dez segundos' }); }
  // Pode ter passado mais de uma fase se o app ficou congelado: alcança sem disparar som em cada uma.
  while (r.remaining <= 0 && !r.finished) {
    countRound(r, true);
    if (r.i < r.seq.length - 1) {
      const over = -r.remaining;
      r.i++;
      r.remaining = r.seq[r.i].dur - over;
      r.endAt = now + r.remaining * 1000;
      r.lastTick = null; r.w30 = false; r.w10 = false;
      ev.push({ kind: 'phase', sound: over < 2 });
    } else {
      r.finished = true; r.remaining = 0;
      ev.push({ kind: 'finish' });
    }
  }
  return ev;
}

export function togglePause(r: Run) {
  if (r.finished) return;
  r.paused = !r.paused;
  if (!r.paused) { r.endAt = Date.now() + r.remaining * 1000; r.lastNow = Date.now(); }
}

export function jump(r: Run, dir: 1 | -1): RunEvent[] {
  if (r.finished) return [];
  const s = r.seq[r.i];
  if (dir < 0 && s.dur - r.remaining > 2) { /* "voltar" reinicia a fase atual */ }
  else {
    if (dir > 0) countRound(r, false);
    const ni = r.i + dir;
    if (ni >= r.seq.length) { r.finished = true; r.remaining = 0; return [{ kind: 'finish' }]; }
    if (ni >= 0) r.i = ni;
  }
  r.remaining = r.seq[r.i].dur;
  r.endAt = Date.now() + r.remaining * 1000;
  r.lastTick = null; r.w30 = false; r.w10 = false;
  return [{ kind: 'phase', sound: !r.paused }];
}

export function phaseSpeech(r: Run) {
  const s = r.seq[r.i], nx = r.seq[r.i + 1];
  if (s.type === 'prep') return 'Preparar';
  if (s.type === 'work') {
    const rounds = r.seq.filter(x => x.type === 'work').length;
    const last = r.mode === 'combate' && rounds > 1 && s.round === rounds;
    return [last ? 'Última ronda' : '', s.theme ?? '', r.mode === 'combate' ? 'Combate!' : 'Valendo!'].filter(Boolean).join('. ');
  }
  if (s.type === 'rest' || s.type === 'cycle') {
    const base = s.type === 'cycle' ? 'Tempo! Descanso entre voltas' : 'Tempo! Descanso';
    return nx?.theme ? `${base}. Próxima: ${nx.theme}` : base;
  }
  if (s.type === 'relax') return 'Tempo! Relaxe';
  return '';
}

export const RunStore = {
  save(r: Run | null) { (r && !r.finished ? AsyncStorage.setItem(KEY, JSON.stringify(r)) : AsyncStorage.removeItem(KEY)).catch(() => {}); },
  async load(): Promise<Run | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;
      const r = JSON.parse(raw) as Run;
      return Date.now() - r.lastNow > 6 * 3600e3 ? null : r;
    } catch { return null; }
  },
};
