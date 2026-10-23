import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { readLegacy } from './legacy';
import { BELTS, type BeltKey } from './theme';
import { DEFAULT_CIRCUITO, type CircuitoConfig, type CircuitoPresetId, type CombateConfig, type Mode } from './sequence';

export type Profile = { name: string; belt: BeltKey; degrees: number };
export type SoundMode = 'voice' | 'beep' | 'mute';
export type ThemeMode = 'auto' | 'light' | 'dark';
// manual: treino registrado à mão na aba Treinos (aula, rola etc.), sem usar o temporizador.
export type Session = { t: number; mode: Mode; work: number; rounds: number; themes: string[]; done: boolean; label: string; manual?: boolean };
export type PresetId = 'aula' | 'competicao' | 'rola' | 'posicao' | 'custom';

type Data = {
  profile: Profile;
  sound: SoundMode;
  theme: ThemeMode;
  weeklyGoal: number;
  preset: PresetId;
  custom: CombateConfig;
  circuito: CircuitoConfig;
  // Circuito escolhido: um dos prontos ou o "Meu circuito" (circuito).
  circuitoPreset: CircuitoPresetId;
  history: Session[];
  // Posições criadas pela pessoa, além da lista padrão.
  positions: string[];
};

export const DEFAULT_CUSTOM: CombateConfig = { prep: 10, work: 300, rest: 60, rounds: 5, relax: 0, themes: [], themeOrder: 'seq' };

const DEFAULTS: Data = {
  profile: { name: '', belt: 'branca', degrees: 0 },
  sound: 'voice',
  theme: 'auto',
  weeklyGoal: 4,
  preset: 'aula',
  custom: DEFAULT_CUSTOM,
  circuito: DEFAULT_CIRCUITO,
  circuitoPreset: 'custom',
  history: [],
  positions: [],
};

const KEY = 'bjj.data.v1';

export type Preset = { id: PresetId; kicker: string; big: string; lines: [string, string]; config: CombateConfig };

// Predefinições do Combate. A de competição segue o tempo de luta da faixa (tabela IBJJF adulto).
export function presetsFor(belt: BeltKey, custom: CombateConfig): Preset[] {
  const b = BELTS[belt];
  const fightMin = b.fight / 60;
  const base = { prep: 10, relax: 0, themes: [] as string[], themeOrder: 'seq' as const };
  return [
    { id: 'aula', kicker: 'Aula', big: '5×5', lines: ['5 voltas · 5 min', '1 min de descanso'], config: { ...base, work: 300, rest: 60, rounds: 5 } },
    { id: 'competicao', kicker: 'Competição', big: `${fightMin}:00`, lines: ['Tempo de luta', `da faixa ${b.name.toLowerCase()}`], config: { ...base, work: b.fight, rest: 0, rounds: 1 } },
    { id: 'rola', kicker: 'Rola livre', big: '8×6', lines: ['8 rolas · 6 min', 'sem tema'], config: { ...base, work: 360, rest: 60, rounds: 8 } },
    { id: 'posicao', kicker: 'Posição', big: '6×3', lines: ['Costas, montada,', 'guarda e mais'], config: { ...base, work: 180, rest: 30, rounds: 6, themes: ['Costas', 'Montada', 'Guarda fechada', 'Meia-guarda', 'Passagem de guarda', 'Raspagem'] } },
    { id: 'custom', kicker: 'Meu treino', big: `${custom.rounds}×${Math.round(custom.work / 60)}`, lines: [`${custom.rounds} voltas`, 'do seu jeito'], config: custom },
  ];
}

type Store = Data & {
  ready: boolean;
  set: (patch: Partial<Data>) => void;
  addSession: (s: Session) => void;
  removeSession: (t: number) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) { try { setData(d => ({ ...d, ...JSON.parse(raw) })); } catch {} }
      else { const old = readLegacy(); if (old) setData(d => ({ ...d, ...old })); }
      loaded.current = true; setReady(true);
    });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const value = useMemo<Store>(() => ({
    ...data,
    ready,
    set: patch => setData(d => ({ ...d, ...patch })),
    addSession: s => setData(d => ({ ...d, history: [...d.history, s].slice(-1000) })),
    removeSession: t => setData(d => ({ ...d, history: d.history.filter(h => h.t !== t) })),
  }), [data, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}
