import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { color?: string; size?: number };

export const IconCombate = ({ color = '#fff', size = 26 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Circle cx={8} cy={9} r={3} /><Circle cx={16} cy={9} r={3} />
    <Path d="M3 20c.8-3.5 2.6-5 5-5s3.4 1 4 2.4c.6-1.4 1.6-2.4 4-2.4s4.2 1.5 5 5" />
  </Svg>
);
export const IconCircuito = ({ color = '#fff', size = 26 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" /><Path d="M18 3v4h-4M6 21v-4h4" />
  </Svg>
);
export const IconCronometro = ({ color = '#fff', size = 26 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Circle cx={12} cy={13} r={8} /><Path d="M12 13V9M10 2h4" />
  </Svg>
);
export const IconTreinos = ({ color = '#fff', size = 26 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Rect x={2.5} y={9} width={19} height={6} rx={1.2} /><Path d="M14 9v6M17 9v6M10 15l-2 6M14 15l2 6" />
  </Svg>
);
export const IconPlay = ({ color = '#111', size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M7 4.5v15l12-7.5z" fill={color} /></Svg>
);
export const IconClose = ({ color = '#fff', size = 18 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><Path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const IconPrev = ({ color = '#fff', size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18 5v14l-10-7zM6 5h2v14H6z" /></Svg>
);
export const IconNext = ({ color = '#fff', size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M6 5v14l10-7zM16 5h2v14h-2z" /></Svg>
);
export const IconShare = ({ color = '#111', size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><Path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></Svg>
);
export const IconFlame = ({ color = '#fff', size = 26 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}><Path d="M12 3c2 3 5 4 5 8a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-7z" /></Svg>
);
export const IconHandle = ({ color = '#9a9ea4', size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><Path d="M5 9h14M5 15h14" /></Svg>
);
export const IconPip = ({ color = '#fff', size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Rect x={2.5} y={4.5} width={19} height={15} rx={2} /><Rect x={12} y={11.5} width={7} height={5} rx={1} fill={color} />
  </Svg>
);
export const IconPlanejar = ({ color = '#fff', size = 26 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Rect x={5} y={4} width={14} height={17} rx={2} /><Path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" />
  </Svg>
);
export const IconBack = ({ color = '#fff', size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><Path d="M15 5l-7 7 7 7" /></Svg>
);
export const IconCheck = ({ color = '#fff', size = 18 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6}><Path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
);
