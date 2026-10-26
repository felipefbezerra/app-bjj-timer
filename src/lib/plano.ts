import { fmtClock, pickThemes, type Phase } from './sequence';
import { type BeltKey } from './theme';

// Plano de treino: a aula inteira montada em blocos, que o temporizador roda em sequência.

export type DrillItem = { name: string; reps: number; dur: number };
export type BlockKind = 'aquecimento' | 'drills' | 'posicao' | 'combates' | 'calma';
export type Block =
  | { kind: 'aquecimento'; dur: number; note: string }
  | { kind: 'calma'; dur: number; note: string }
  | { kind: 'drills'; items: DrillItem[]; rest: number }
  | { kind: 'posicao'; rounds: number; work: number; rest: number; order: 'seq' | 'rand'; themes: string[] }
  | { kind: 'combates'; rounds: number; work: number; rest: number };

// Quem montou o plano, quando ele veio de outra pessoa.
export type From = { name: string; belt: BeltKey };

export type Plan = {
  id: string;
  name: string;
  weekday: number | null; // 0 = domingo; null = sem dia marcado
  time: number;           // minutos desde a meia-noite
  weekly: boolean;
  once?: number;          // dia marcado de um plano que não repete
  prep: number;
  change: number;         // troca entre blocos
  blocks: Block[];
  notes: string;
  updated: number;
  from?: From;
};

export const BLOCK_NAME: Record<BlockKind, string> = {
  aquecimento: 'Aquecimento', drills: 'Drills', posicao: 'Posição específica', combates: 'Combates', calma: 'Volta à calma',
};
// Para "volta à calma pulada" e afins no resumo.
const SKIPPED: Record<BlockKind, string> = {
  aquecimento: 'aquecimento pulado', drills: 'drills pulados', posicao: 'posição específica pulada', combates: 'combates pulados', calma: 'volta à calma pulada',
};

// Cor de cada bloco, a mesma no plano, na barra e no resumo. No tema claro, tons mais escuros.
const COL_DARK: Record<BlockKind, string> = { aquecimento: '#f2d43a', drills: '#6aa8ff', posicao: '#c49bff', combates: '#8fe04a', calma: '#b8bcc2' };
const COL_LIGHT: Record<BlockKind, string> = { aquecimento: '#8a6d00', drills: '#1f5fb8', posicao: '#6b3fc4', combates: '#2f7a0e', calma: '#5d6066' };
export function blockColor(kind: BlockKind, dark: boolean) { return (dark ? COL_DARK : COL_LIGHT)[kind]; }

export function newBlock(kind: BlockKind): Block {
  switch (kind) {
    case 'aquecimento': return { kind, dur: 600, note: '' };
    case 'calma': return { kind, dur: 300, note: '' };
    case 'drills': return { kind, items: [{ name: 'Drill 1', reps: 3, dur: 180 }], rest: 15 };
    case 'posicao': return { kind, rounds: 4, work: 180, rest: 30, order: 'rand', themes: ['Costas', 'Montada', 'Meia-guarda', 'Guarda fechada'] };
    case 'combates': return { kind, rounds: 6, work: 360, rest: 60 };
  }
}

const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function newPlan(now = new Date()): Plan {
  const weekday = now.getDay();
  const p: Plan = {
    id: now.getTime().toString(36), name: `Aula de ${WEEKDAY[weekday]}`, weekday, time: 19 * 60 + 30, weekly: true, prep: 10, change: 30, notes: '', updated: now.getTime(),
    blocks: [
      { kind: 'aquecimento', dur: 600, note: 'Corrida, fuga de quadril, rolamentos' },
      { kind: 'drills', rest: 15, items: [{ name: 'Passagem toreando', reps: 3, dur: 180 }, { name: 'Raspagem de gancho', reps: 2, dur: 180 }, { name: 'Pegada nas costas', reps: 1, dur: 300 }] },
      newBlock('posicao'),
      newBlock('combates'),
      { kind: 'calma', dur: 300, note: 'Alongamento e respiração' },
    ],
  };
  return p;
}

export function blockSeconds(b: Block) {
  switch (b.kind) {
    case 'aquecimento': case 'calma': return b.dur;
    case 'drills': {
      const reps = b.items.reduce((a, x) => a + x.reps, 0);
      return b.items.reduce((a, x) => a + x.reps * x.dur, 0) + b.rest * Math.max(0, reps - 1);
    }
    case 'posicao': case 'combates': return b.rounds * b.work + b.rest * Math.max(0, b.rounds - 1);
  }
}

export function planSeconds(p: Plan) {
  return p.prep + p.blocks.reduce((a, b) => a + blockSeconds(b), 0) + p.change * Math.max(0, p.blocks.length - 1);
}

// Quantas coisas o bloco tem para fazer (drills, voltas, combates). Aquecimento e volta à calma contam como 1.
export function blockTarget(b: Block) {
  return b.kind === 'drills' ? b.items.length : b.kind === 'posicao' || b.kind === 'combates' ? b.rounds : 1;
}

// Resumo curto de um bloco, como no card do plano: "3 drills", "Posição 4×3", "6 combates".
export function blockChip(b: Block) {
  switch (b.kind) {
    case 'drills': return `${b.items.length} ${b.items.length === 1 ? 'drill' : 'drills'}`;
    case 'posicao': return `Posição ${b.rounds}×${mins(b.work)}`;
    case 'combates': return `${b.rounds} ${b.rounds === 1 ? 'combate' : 'combates'}`;
    default: return BLOCK_NAME[b.kind];
  }
}

// O que tem dentro do bloco, numa linha: notas, drills, posições ou tempos.
export function blockDetail(b: Block) {
  switch (b.kind) {
    case 'aquecimento': case 'calma': return b.note;
    case 'drills': return b.items.map(x => x.name).join(', ');
    case 'posicao': return [`${b.rounds} × ${fmtClock(b.work)}`, b.themes.join(', ')].filter(Boolean).join(' · ');
    case 'combates': return `${b.rounds} × ${fmtClock(b.work)} · descanso ${fmtClock(b.rest)}`;
  }
}

// Linha da lista de planos: "4 drills · 4 combates de 5 min".
export function planLine(p: Plan) {
  const drills = p.blocks.reduce((a, b) => a + (b.kind === 'drills' ? b.items.length : 0), 0);
  const fights = p.blocks.filter(b => b.kind === 'combates') as Extract<Block, { kind: 'combates' }>[];
  const n = fights.reduce((a, b) => a + b.rounds, 0);
  const parts: string[] = [];
  if (drills) parts.push(`${drills} ${drills === 1 ? 'drill' : 'drills'}`);
  if (n) parts.push(`${n} ${n === 1 ? 'combate' : 'combates'}${fights.length === 1 ? ` de ${mins(fights[0].work)} min` : ''}`);
  return parts.join(' · ') || p.blocks.map(blockChip).join(' · ') || 'Sem blocos';
}

export function planStats(p: Plan) {
  let drills = 0, fights = 0, fight = 0;
  for (const b of p.blocks) {
    if (b.kind === 'drills') drills += b.items.length;
    if (b.kind === 'combates') { fights += b.rounds; fight += b.rounds * b.work; }
    if (b.kind === 'posicao') fight += b.rounds * b.work;
  }
  return { drills, fights, fight };
}

function mins(s: number) { return s % 60 ? (s / 60).toFixed(1).replace('.', ',') : String(s / 60); }

// "1:30 h" ou "45 min".
export function hmParts(s: number): [string, string] {
  const m = Math.round(s / 60);
  return m >= 60 ? [`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`, 'h'] : [String(m), 'min'];
}

export function clockTime(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

// Próxima vez que o plano acontece (com até 2 horas de tolerância depois do horário).
export function nextAt(p: Plan, now = new Date()): number | null {
  if (p.weekday === null) return null;
  if (!p.weekly) return p.once && p.once > now.getTime() - 2 * 3600e3 ? p.once : null;
  return upcoming(p.weekday, p.time, now);
}

export function upcoming(weekday: number, time: number, now = new Date()) {
  const d = new Date(now);
  d.setHours(Math.floor(time / 60), time % 60, 0, 0);
  d.setDate(d.getDate() + ((weekday - now.getDay() + 7) % 7));
  if (d.getTime() < now.getTime() - 2 * 3600e3) d.setDate(d.getDate() + 7);
  return d.getTime();
}

const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function dayLabel(t: number, now = new Date()) {
  const d = new Date(t);
  const a = new Date(now); a.setHours(0, 0, 0, 0);
  const b = new Date(d); b.setHours(0, 0, 0, 0);
  const days = Math.round((b.getTime() - a.getTime()) / 864e5);
  return days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
}

export function whenLabel(p: Plan, now = new Date()) {
  const t = nextAt(p, now);
  return t === null ? 'Sem dia marcado' : `${dayLabel(t, now)} · ${clockTime(p.time)}`;
}

const REPEAT = ['Todo domingo', 'Toda segunda', 'Toda terça', 'Toda quarta', 'Toda quinta', 'Toda sexta', 'Todo sábado'];
export function repeatLabel(p: Plan) {
  return p.weekday === null ? 'Sem dia' : p.weekly ? REPEAT[p.weekday] : 'Só uma vez';
}

// Monta a sequência do temporizador: preparar, cada bloco com seus intervalos e uma troca entre blocos.
// Cada fase leva o bloco (bi), o nome que aparece na tela, a cor e o que a voz fala.
export function buildPlanSequence(p: Plan): Phase[] {
  const seq: Phase[] = [];
  const push = (ph: Phase) => { if (ph.dur > 0) seq.push(ph); };
  push({ type: 'prep', dur: p.prep, say: p.blocks[0] ? `Preparar. Começa com ${BLOCK_NAME[p.blocks[0].kind].toLowerCase()}` : 'Preparar' });
  const n = p.blocks.length;
  p.blocks.forEach((b, bi) => {
    const block = BLOCK_NAME[b.kind];
    const where = n > 1 ? `Bloco ${bi + 1} de ${n} · ${block}` : block;
    if (b.kind === 'aquecimento' || b.kind === 'calma') {
      push({ type: 'work', dur: b.dur, bi, name: block, look: b.kind === 'aquecimento' ? 'prep' : 'relax', theme: b.note.trim() || undefined, tag: where,
        say: b.kind === 'aquecimento' ? 'Aquecimento. Valendo!' : 'Volta à calma' });
    } else if (b.kind === 'drills') {
      const total = b.items.reduce((a, x) => a + x.reps, 0);
      let k = 0;
      b.items.forEach((x, di) => {
        for (let r = 1; r <= x.reps; r++) {
          k++;
          push({ type: 'work', dur: x.dur, bi, item: di, name: 'Drill', theme: x.name, tag: `${block} · ${k} de ${total}`,
            say: `${x.name}${x.reps > 1 ? `, ${r} de ${x.reps}` : ''}. Valendo!` });
          if (k < total) push({ type: 'rest', dur: b.rest, bi, name: 'Troca', tag: `${block} · ${k} de ${total}` });
        }
      });
    } else if (b.kind === 'posicao' || b.kind === 'combates') {
      const fight = b.kind === 'combates';
      const themes = b.kind === 'posicao' ? pickThemes(b.themes, b.order, b.rounds) : [];
      for (let r = 1; r <= b.rounds; r++) {
        const last = b.rounds > 1 && r === b.rounds;
        const theme = themes[r - 1];
        const count = `${fight ? 'Combate' : 'Volta'} ${r} de ${b.rounds}`;
        push({ type: 'work', dur: b.work, bi, round: r, name: fight ? 'Combate' : 'Posição', theme, tag: count,
          say: [last ? (fight ? 'Último combate' : 'Última volta') : '', theme ?? '', 'Combate!'].filter(Boolean).join('. ') });
        if (r < b.rounds) push({ type: 'rest', dur: b.rest, bi, round: r, name: 'Descanso', tag: count });
      }
    }
    const next = p.blocks[bi + 1];
    if (next) push({ type: 'cycle', dur: p.change, bi, name: 'Troca de bloco', tag: `A seguir: ${BLOCK_NAME[next.kind].toLowerCase()}`, say: `Tempo! Agora: ${BLOCK_NAME[next.kind].toLowerCase()}` });
  });
  return seq;
}

// Quanto de cada bloco foi feito, pelas fases que o temporizador contou (metade do tempo ou mais).
export function doneFromRun(p: Plan, seq: Phase[], counted: number[]) {
  return p.blocks.map((b, bi) => {
    const hits = counted.map(i => seq[i]).filter(s => s && s.bi === bi && s.type === 'work');
    if (b.kind === 'drills') return new Set(hits.map(s => s.item)).size;
    if (b.kind === 'posicao' || b.kind === 'combates') return hits.length;
    return hits.length ? 1 : 0;
  });
}

// "5 de 6 combates · volta à calma pulada"
export function doneLine(p: Plan, done: number[]) {
  const parts: string[] = [];
  p.blocks.forEach((b, i) => {
    const target = blockTarget(b);
    if (done[i] === 0) parts.push(SKIPPED[b.kind]);
    else if (done[i] < target) parts.push(b.kind === 'combates' ? `${done[i]} de ${target} combates` : b.kind === 'posicao' ? `${done[i]} de ${target} voltas de posição` : `${done[i]} de ${target} drills`);
  });
  return parts.length ? parts.join(' · ') : 'Tudo feito como planejado';
}
