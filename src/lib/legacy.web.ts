import { BELTS, type BeltKey } from './theme';

// Quando a versão web substitui o site antigo no mesmo endereço, traz o que ficou salvo nele:
// histórico de treinos, faixa e graus, modo de som e tema. Roda só na primeira abertura.
function get(k: string): unknown {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { return null; }
}

type Old = { t: number; mode: string; work?: number; rounds?: number; themes?: string[]; done?: boolean };

export function readLegacy(): Record<string, unknown> | null {
  const history = get('bjj.history') as Old[] | null;
  const belt = get('bjj.belt') as { k?: string; degrees?: number } | null;
  const sound = get('bjj.sound'), theme = get('bjj.theme');
  if (!history?.length && !belt && !sound && !theme) return null;
  const out: Record<string, unknown> = {};
  if (Array.isArray(history)) {
    out.history = history.filter(h => typeof h?.t === 'number').map(h => {
      const mode = h.mode === 'circuito' || h.mode === 'tabata' ? 'circuito' : 'combate';
      return { t: h.t, mode, work: h.work ?? 0, rounds: h.rounds ?? 0, themes: h.themes ?? [], done: !!h.done, label: mode === 'circuito' ? 'Circuito' : 'Combate' };
    });
  }
  if (belt?.k && belt.k in BELTS) {
    const k = belt.k as BeltKey;
    out.profile = { name: '', belt: k, degrees: Math.min(BELTS[k].max, Math.max(0, belt.degrees ?? 0)) };
  }
  if (sound === 'voice' || sound === 'beep' || sound === 'mute') out.sound = sound;
  if (theme === 'auto' || theme === 'light' || theme === 'dark') out.theme = theme;
  return out;
}
