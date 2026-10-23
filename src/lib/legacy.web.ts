import { DEFAULT_CUSTOM } from './store';
import { BELTS, type BeltKey } from './theme';

// Quando a versão web substitui o site antigo no mesmo endereço, traz o que ficou salvo nele:
// histórico de treinos, faixa e graus, modo de som, tema e posições. Roda só na primeira abertura.
function get(k: string): unknown {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { return null; }
}

type Old = { t: number; mode: string; work?: number; rounds?: number; themes?: string[]; done?: boolean };

export function readLegacy(): Record<string, unknown> | null {
  const history = get('bjj.history') as Old[] | null;
  const belt = get('bjj.belt') as { k?: string; degrees?: number } | null;
  const sound = get('bjj.sound'), theme = get('bjj.theme');
  const positions = get('bjj.positions'), rondas = get('bjj.rondas') as { themes?: unknown; themeOrder?: unknown } | null;
  if (!history?.length && !belt && !sound && !theme && !positions && !rondas) return null;
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
  const strs = (x: unknown) => Array.isArray(x) ? x.filter((t): t is string => typeof t === 'string' && !!t.trim()) : [];
  if (strs(positions).length) out.positions = strs(positions);
  // As posições escolhidas no Combate do site antigo vão para o "Meu treino".
  const themes = strs(rondas?.themes);
  if (themes.length) out.custom = { ...DEFAULT_CUSTOM, themes, themeOrder: rondas?.themeOrder === 'rand' ? 'rand' : 'seq' };
  return out;
}
