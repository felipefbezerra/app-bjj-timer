import { createContext, useContext } from 'react';

// Direção visual "Tatame": fundo de tecido de kimono, tipografia condensada e a faixa como destaque.

export const DARK = {
  dark: true,
  ground: '#111315',
  panel: '#1b1e21',
  line: '#2a2e33',
  line2: '#3a3f45',
  fg: '#f3f1ea',
  soft: '#c9ccd0',
  muted: '#9a9ea4',
  ink: '#111315',
  prep: '#f2d43a',
  work: '#8fe04a',
  rest: '#ff6a5c',
  cycle: '#f2d43a',
  relax: '#5aa9e6',
  bar: 'rgba(17,19,21,.96)',
  stitch: 'rgba(255,255,255,.10)',
  ring: 'rgba(243,241,234,.25)',
  fabric: 'escuro' as TextureKey,
};

export type Palette = typeof DARK;

// Versão clara: tecido claro, texto grafite e as cores das fases mais escuras para ler bem no fundo claro.
export const LIGHT: Palette = {
  dark: false,
  ground: '#eeebe3',
  panel: 'rgba(255,255,255,.78)',
  line: '#d6d2c8',
  line2: '#bdb7aa',
  fg: '#17181a',
  soft: '#3d4045',
  muted: '#5d6066',
  ink: '#f6f4ee',
  prep: '#8a6d00',
  work: '#2f7a0e',
  rest: '#c2321f',
  cycle: '#8a6d00',
  relax: '#2f6fd6',
  bar: 'rgba(246,244,238,.94)',
  stitch: 'rgba(0,0,0,.14)',
  ring: 'rgba(23,24,26,.25)',
  fabric: 'claro',
};

export const ThemeCtx = createContext<Palette>(DARK);
export const useC = () => useContext(ThemeCtx);

export const F = {
  reg: 'BarlowCondensed_400Regular',
  med: 'BarlowCondensed_500Medium',
  semi: 'BarlowCondensed_600SemiBold',
  bold: 'BarlowCondensed_700Bold',
  num: 'Oswald_600SemiBold',
  numMed: 'Oswald_500Medium',
};

export type TextureKey = 'escuro' | 'verde' | 'vermelho' | 'amarelo' | 'azul' | 'claro';

export const TEXTURES: Record<TextureKey, number> = {
  escuro: require('@/assets/textures/tecido-escuro.jpg'),
  verde: require('@/assets/textures/tecido-verde.jpg'),
  vermelho: require('@/assets/textures/tecido-vermelho.jpg'),
  amarelo: require('@/assets/textures/tecido-amarelo.jpg'),
  azul: require('@/assets/textures/tecido-azul.jpg'),
  claro: require('@/assets/textures/tecido-claro.jpg'),
};

export type BeltKey = 'branca' | 'cinza' | 'amarela' | 'laranja' | 'verde' | 'azul' | 'roxa' | 'marrom' | 'preta';

// color: a faixa; tip: a ponteira dos graus; accent/ink: destaque e texto sobre ele no tema escuro;
// light/lightInk: o mesmo no tema claro.
export const BELTS: Record<BeltKey, { name: string; color: string; tip: string; accent: string; ink: string; light: string; lightInk: string; max: number; kids?: boolean; fight: number }> = {
  branca: { name: 'Branca', color: '#f2f1ec', tip: '#111111', accent: '#f2f1ec', ink: '#1c1d1f', light: '#17181a', lightInk: '#f6f4ee', max: 4, fight: 300 },
  azul: { name: 'Azul', color: '#1f5fd1', tip: '#111111', accent: '#4a8cf0', ink: '#08111f', light: '#2f6fd6', lightInk: '#ffffff', max: 4, fight: 360 },
  roxa: { name: 'Roxa', color: '#6a2fb0', tip: '#111111', accent: '#a875f0', ink: '#1d0b33', light: '#7c4ddb', lightInk: '#ffffff', max: 4, fight: 420 },
  marrom: { name: 'Marrom', color: '#6b3f1d', tip: '#111111', accent: '#c9925c', ink: '#24140a', light: '#7d5230', lightInk: '#ffffff', max: 4, fight: 480 },
  preta: { name: 'Preta', color: '#121212', tip: '#d22b1f', accent: '#ef4a3d', ink: '#ffffff', light: '#b8281c', lightInk: '#ffffff', max: 6, fight: 600 },
  cinza: { name: 'Cinza', kids: true, color: '#8b8e94', tip: '#111111', accent: '#b3b7be', ink: '#16171a', light: '#5d6066', lightInk: '#ffffff', max: 4, fight: 240 },
  amarela: { name: 'Amarela', kids: true, color: '#f2c81f', tip: '#111111', accent: '#f2c81f', ink: '#1c1d1f', light: '#8a6d00', lightInk: '#ffffff', max: 4, fight: 240 },
  laranja: { name: 'Laranja', kids: true, color: '#f07a1a', tip: '#111111', accent: '#ff9440', ink: '#1c1d1f', light: '#b8550a', lightInk: '#ffffff', max: 4, fight: 240 },
  verde: { name: 'Verde', kids: true, color: '#2e9b3e', tip: '#111111', accent: '#55c665', ink: '#0b1f0e', light: '#2f7a0e', lightInk: '#ffffff', max: 4, fight: 300 },
};

export const BELT_ORDER: BeltKey[] = ['branca', 'azul', 'roxa', 'marrom', 'preta', 'cinza', 'amarela', 'laranja', 'verde'];

// Faixa com o destaque certo para o tema atual.
export function beltLook(belt: BeltKey, c: Palette) {
  const b = BELTS[belt];
  return { ...b, accent: c.dark ? b.accent : b.light, ink: c.dark ? b.ink : b.lightInk };
}
