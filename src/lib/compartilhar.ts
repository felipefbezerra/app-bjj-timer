import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { Platform } from 'react-native';

import { upcoming, type Block, type From, type Plan } from './plano';
import { BELTS, type BeltKey } from './theme';

// Compartilhar um plano: ele vai inteiro dentro do link (comprimido), sem conta nem servidor.
// O mesmo código vai no arquivo do plano e no QR code do PDF.

export const SITE = 'https://temporizador-bjj.vercel.app';
export type { From };
export type Shared = { plan: Omit<Plan, 'id' | 'updated'>; from?: From };

type WireBlock =
  | ['a' | 'v', number, string]
  | ['d', number, [string, number, number][]]
  | ['p', number, number, number, 0 | 1, string[]]
  | ['c', number, number, number];
// [versão, nome, dia (-1 = sem dia), horário, repete, preparar, troca, observações, blocos, nome de quem mandou, faixa]
type Wire = [1, string, number, number, 0 | 1, number, number, string, WireBlock[], string, string];

function toWire(b: Block): WireBlock {
  switch (b.kind) {
    case 'aquecimento': return ['a', b.dur, b.note];
    case 'calma': return ['v', b.dur, b.note];
    case 'drills': return ['d', b.rest, b.items.map(x => [x.name, x.reps, x.dur])];
    case 'posicao': return ['p', b.rounds, b.work, b.rest, b.order === 'rand' ? 1 : 0, b.themes];
    case 'combates': return ['c', b.rounds, b.work, b.rest];
  }
}

// Números e textos de fora: só entra o que faz sentido, dentro dos limites do editor.
const num = (v: unknown, lo: number, hi: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.max(lo, Math.min(hi, v))) : def);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

function fromWire(w: unknown): Block | null {
  if (!Array.isArray(w)) return null;
  switch (w[0]) {
    case 'a': return { kind: 'aquecimento', dur: num(w[1], 60, 3600, 600), note: str(w[2], 80) };
    case 'v': return { kind: 'calma', dur: num(w[1], 60, 3600, 300), note: str(w[2], 80) };
    case 'd': {
      const items = (Array.isArray(w[2]) ? w[2] : []).slice(0, 12).filter(Array.isArray)
        .map((x: unknown[]) => ({ name: str(x[0], 40) || 'Drill', reps: num(x[1], 1, 10, 1), dur: num(x[2], 15, 1200, 180) }));
      return items.length ? { kind: 'drills', rest: num(w[1], 0, 300, 15), items } : null;
    }
    case 'p': return { kind: 'posicao', rounds: num(w[1], 1, 30, 4), work: num(w[2], 30, 1800, 180), rest: num(w[3], 0, 600, 30), order: w[4] === 1 ? 'rand' : 'seq',
      themes: (Array.isArray(w[5]) ? w[5] : []).slice(0, 40).map(t => str(t, 40)).filter(Boolean) };
    case 'c': return { kind: 'combates', rounds: num(w[1], 1, 30, 6), work: num(w[2], 30, 1800, 360), rest: num(w[3], 0, 600, 60) };
    default: return null;
  }
}

export function encodePlan(p: Plan, from?: From): string {
  const wire: Wire = [1, p.name, p.weekday ?? -1, p.time, p.weekly ? 1 : 0, p.prep, p.change, p.notes, p.blocks.map(toWire), from?.name ?? '', from?.belt ?? ''];
  // "+" vira espaço em alguns leitores de link; "$" atrapalha em mensagens. Troca por "_" e ".".
  return compressToEncodedURIComponent(JSON.stringify(wire)).replace(/\+/g, '_').replace(/\$/g, '.');
}

export function decodePlan(code: string): Shared | null {
  try {
    const raw = decompressFromEncodedURIComponent(code.trim().replace(/_/g, '+').replace(/\./g, '$').replace(/ /g, '+'));
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (!Array.isArray(w) || w[0] !== 1) return null;
    const blocks = (Array.isArray(w[8]) ? w[8] : []).slice(0, 12).map(fromWire).filter((b): b is Block => !!b);
    const weekday = typeof w[2] === 'number' && w[2] >= 0 && w[2] <= 6 ? Math.round(w[2]) : null;
    const time = num(w[3], 0, 1439, 19 * 60 + 30);
    const weekly = w[4] !== 0;
    const plan: Shared['plan'] = {
      name: str(w[1], 40) || 'Plano recebido', weekday, time, weekly, prep: num(w[5], 0, 120, 10), change: num(w[6], 0, 600, 30), notes: str(w[7], 400), blocks,
      once: weekday !== null && !weekly ? upcoming(weekday, time) : undefined,
    };
    const name = str(w[9], 40), belt = str(w[10], 10);
    return { plan, from: name ? { name, belt: belt in BELTS ? (belt as BeltKey) : 'branca' } : undefined };
  } catch {
    return null;
  }
}

// Na versão web, o link aponta para o próprio site aberto (assim funciona nas prévias da Vercel também).
export function planLink(code: string) {
  const base = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : SITE;
  return `${base}/receber?p=${code}`;
}
// Link que abre direto o app instalado no celular.
export function appLink(code: string) { return `bjjtimer://receber?p=${code}`; }

// Acha o código num link colado, no texto da mensagem do WhatsApp ou no arquivo do plano.
export function findCode(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  try {
    const j = JSON.parse(t);
    if (j && typeof j.codigo === 'string') return j.codigo;
  } catch {}
  const m = t.match(/[?&#]p=([A-Za-z0-9_.+\-$]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9_.+\-$]{16,}$/.test(t) ? t : null;
}

// Conteúdo do arquivo do plano: legível por gente e com o código para importar.
export function planFile(p: Plan, from?: From) {
  const code = encodePlan(p, from);
  return JSON.stringify({ tipo: 'plano-de-treino-bjj', versao: 1, nome: p.name, de: from?.name || undefined, link: planLink(code), codigo: code, plano: { ...p, id: undefined, updated: undefined, once: undefined, from: undefined } }, null, 2);
}

export function fileName(p: Plan, ext: string) {
  const base = (p.name || 'Plano').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'plano';
  return `${base}.${ext}`;
}
