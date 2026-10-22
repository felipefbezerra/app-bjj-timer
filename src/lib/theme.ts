// Direção visual "Tatame": fundo de tecido de kimono, tipografia condensada e a faixa como destaque.

export const C = {
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
};

export const F = {
  reg: 'BarlowCondensed_400Regular',
  med: 'BarlowCondensed_500Medium',
  semi: 'BarlowCondensed_600SemiBold',
  bold: 'BarlowCondensed_700Bold',
  num: 'Oswald_600SemiBold',
  numMed: 'Oswald_500Medium',
};

export const TEXTURES = {
  escuro: require('@/assets/textures/tecido-escuro.jpg'),
  verde: require('@/assets/textures/tecido-verde.jpg'),
  vermelho: require('@/assets/textures/tecido-vermelho.jpg'),
  amarelo: require('@/assets/textures/tecido-amarelo.jpg'),
  azul: require('@/assets/textures/tecido-azul.jpg'),
  claro: require('@/assets/textures/tecido-claro.jpg'),
};

export type BeltKey = 'branca' | 'cinza' | 'amarela' | 'laranja' | 'verde' | 'azul' | 'roxa' | 'marrom' | 'preta';

// color: a faixa; tip: a ponteira dos graus; accent/ink: destaque e texto sobre ele no tema escuro.
export const BELTS: Record<BeltKey, { name: string; color: string; tip: string; accent: string; ink: string; max: number; kids?: boolean; fight: number }> = {
  branca: { name: 'Branca', color: '#f2f1ec', tip: '#111111', accent: '#f2f1ec', ink: '#1c1d1f', max: 4, fight: 300 },
  azul: { name: 'Azul', color: '#1f5fd1', tip: '#111111', accent: '#4a8cf0', ink: '#08111f', max: 4, fight: 360 },
  roxa: { name: 'Roxa', color: '#6a2fb0', tip: '#111111', accent: '#a875f0', ink: '#1d0b33', max: 4, fight: 420 },
  marrom: { name: 'Marrom', color: '#6b3f1d', tip: '#111111', accent: '#c9925c', ink: '#24140a', max: 4, fight: 480 },
  preta: { name: 'Preta', color: '#121212', tip: '#d22b1f', accent: '#ef4a3d', ink: '#ffffff', max: 6, fight: 600 },
  cinza: { name: 'Cinza', kids: true, color: '#8b8e94', tip: '#111111', accent: '#b3b7be', ink: '#16171a', max: 4, fight: 240 },
  amarela: { name: 'Amarela', kids: true, color: '#f2c81f', tip: '#111111', accent: '#f2c81f', ink: '#1c1d1f', max: 4, fight: 240 },
  laranja: { name: 'Laranja', kids: true, color: '#f07a1a', tip: '#111111', accent: '#ff9440', ink: '#1c1d1f', max: 4, fight: 240 },
  verde: { name: 'Verde', kids: true, color: '#2e9b3e', tip: '#111111', accent: '#55c665', ink: '#0b1f0e', max: 4, fight: 300 },
};

export const BELT_ORDER: BeltKey[] = ['branca', 'azul', 'roxa', 'marrom', 'preta', 'cinza', 'amarela', 'laranja', 'verde'];
