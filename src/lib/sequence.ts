export type Mode = 'combate' | 'circuito';
export type PhaseType = 'prep' | 'work' | 'rest' | 'cycle' | 'relax';

export type Phase = {
  type: PhaseType;
  dur: number;
  round?: number;
  cycle?: number;
  theme?: string;
};

export type CombateConfig = { prep: number; work: number; rest: number; rounds: number; relax: number; themes: string[]; themeOrder: 'seq' | 'rand' };
export type Station = { name: string; dur: number };
export type CircuitoConfig = { prep: number; stations: Station[]; rest: number; rounds: number; cycleRest: number; relax: number };

export const POSITIONS = ['Passagem de guarda', 'Guarda fechada', 'Meia-guarda', 'Guarda aberta', 'Raspagem', 'Montada',
  'Costas', 'Cem quilos', 'Joelho na barriga', 'Queda', 'Saída de montada', 'Saída de cem quilos', 'Finalização'];

export const DEFAULT_CIRCUITO: CircuitoConfig = {
  prep: 10,
  stations: [{ name: 'Sprawl', dur: 40 }, { name: 'Fuga de quadril', dur: 40 }, { name: 'Ponte', dur: 40 }, { name: 'Pegada no kimono', dur: 40 }, { name: 'Burpee', dur: 40 }],
  rest: 20, rounds: 3, cycleRest: 60, relax: 0,
};

export function buildSequence(mode: Mode, c: CombateConfig | CircuitoConfig): Phase[] {
  const seq: Phase[] = [];
  const push = (type: PhaseType, dur: number, extra: Partial<Phase> = {}) => { if (dur > 0) seq.push({ type, dur, ...extra }); };
  push('prep', c.prep);
  if (mode === 'circuito') {
    const cc = c as CircuitoConfig;
    for (let v = 1; v <= cc.rounds; v++) {
      cc.stations.forEach((x, i) => {
        push('work', x.dur, { round: i + 1, cycle: v, theme: x.name });
        if (i < cc.stations.length - 1) push('rest', cc.rest, { round: i + 1, cycle: v });
      });
      if (v < cc.rounds) push('cycle', cc.cycleRest, { round: cc.stations.length, cycle: v });
    }
  } else {
    const cb = c as CombateConfig;
    const themes = cb.themeOrder === 'rand' ? shuffle(cb.themes) : cb.themes;
    for (let r = 1; r <= cb.rounds; r++) {
      push('work', cb.work, { round: r, theme: themes.length ? themes[(r - 1) % themes.length] : undefined });
      if (r < cb.rounds) push('rest', cb.rest, { round: r });
    }
  }
  push('relax', c.relax);
  return seq;
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function totalSeconds(seq: Phase[]) { return seq.reduce((a, s) => a + s.dur, 0); }

export function fmtClock(s: number) {
  s = Math.max(0, Math.ceil(s));
  const m = Math.floor(s / 60), r = s % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

export function phaseName(mode: Mode, s: Phase) {
  switch (s.type) {
    case 'prep': return 'Preparar';
    case 'work': return mode === 'combate' ? 'Luta' : 'Exercício';
    case 'rest': return mode === 'combate' ? 'Descanso' : 'Troca';
    case 'cycle': return 'Entre voltas';
    case 'relax': return 'Relaxe';
  }
}
