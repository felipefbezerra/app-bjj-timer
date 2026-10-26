import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F, TONES, useC, type ToneKey } from '@/lib/theme';

type TxtProps = TextProps & { f?: keyof typeof F; size?: number; color?: string; caps?: boolean; track?: number; style?: StyleProp<TextStyle> };

// Texto na tipografia do app. caps + track dão o visual de etiqueta (maiúsculas espaçadas).
// "title" é a Anton dos títulos e nomes, com folga em cima para os acentos (Ô, Ç) não encostarem.
export function Txt({ f = 'med', size = 16, color, caps, track, style, ...rest }: TxtProps) {
  const C = useC();
  const title = f === 'title';
  const fs = title ? Math.round(size * 0.95) : size;
  const tr = title ? 0.01 : track;
  return (
    <Text
      {...rest}
      style={[{ fontFamily: F[f], fontSize: fs, color: color ?? C.fg, letterSpacing: tr ? fs * tr : undefined, textTransform: caps ? 'uppercase' : 'none',
        lineHeight: title ? Math.round(fs * 1.3) : undefined }, style]}
    />
  );
}

// Fundo liso da tela; no treino, na cor da fase.
export function Backdrop({ tone, children, style }: { tone?: ToneKey; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const C = useC();
  return <View style={[{ flex: 1, backgroundColor: tone ? TONES[tone] : C.ground }, style]}>{children}</View>;
}

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  // Laterais seguras para o entalhe da câmera com o celular deitado.
  return (
    <Backdrop>
      <View style={{ flex: 1, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>{children}</View>
    </Backdrop>
  );
}

// Largura de sobra (celular deitado, tablet, computador): as telas usam duas colunas.
export function useWide() {
  return useWindowDimensions().width >= 600;
}
// Pouca altura (celular deitado): barra de abas e folhas mais baixas.
export function useShort() {
  return useWindowDimensions().height < 500;
}

const MAX_W = 1100;

// Duas colunas que rolam separadas quando há largura; uma embaixo da outra no celular em pé.
export function Split({ left, right, flexLeft = 1, style }: { left: ReactNode; right: ReactNode; flexLeft?: number; style?: StyleProp<ViewStyle> }) {
  const wide = useWide();
  if (!wide) return <ScrollView contentContainerStyle={[{ paddingBottom: 24 }, style]}>{left}{right}</ScrollView>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', width: '100%', maxWidth: MAX_W, alignSelf: 'center' }}>
      <ScrollView style={{ flex: flexLeft }} contentContainerStyle={[{ paddingBottom: 24 }, style]}>{left}</ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ paddingBottom: 24 }, style]}>{right}</ScrollView>
    </View>
  );
}

export function Panel({ children, style, stitch }: { children: ReactNode; style?: StyleProp<ViewStyle>; stitch?: boolean }) {
  const C = useC();
  return (
    <View style={[s.panel, { backgroundColor: C.panel }, style]}>
      {stitch && <View pointerEvents="none" style={[s.stitch, { borderColor: C.stitch }]} />}
      {children}
    </View>
  );
}

export function Label({ children, color, size = 14 }: { children: ReactNode; color?: string; size?: number }) {
  const C = useC();
  return <Txt f="med" size={size} color={color ?? C.muted} caps track={0.13}>{children}</Txt>;
}

export function PrimaryButton({ label, onPress, icon, height = 64, light = true }: { label: string; onPress: () => void; icon?: ReactNode; height?: number; light?: boolean }) {
  const C = useC();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.primary, { height, borderRadius: height / 2, backgroundColor: light ? C.fg : 'transparent', borderWidth: light ? 0 : 1, borderColor: C.line2, opacity: pressed ? 0.85 : 1 }]}>
      {icon}
      <Txt f="bold" size={height > 56 ? 22 : 16} color={light ? C.ink : C.fg} caps track={height > 56 ? 0.12 : 0.08} numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1 }}>{label}</Txt>
    </Pressable>
  );
}

export function IconButton({ onPress, label, children, size = 44, border }: { onPress: () => void; label: string; children: ReactNode; size?: number; border?: string }) {
  const C = useC();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: border ?? C.ring, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      {children}
    </Pressable>
  );
}

// Valor grande com rótulo pequeno embaixo (tempos, contagens).
export function Stat({ value, label, color, size = 22, align = 'center' }: { value: string; label: string; color?: string; size?: number; align?: 'center' | 'flex-start' }) {
  const C = useC();
  return (
    <View style={{ alignItems: align, gap: 3, flex: 1 }}>
      <Txt f="numMed" size={size} color={color ?? C.fg}>{value}</Txt>
      <Txt f="med" size={12} color={C.muted} caps track={0.1}>{label}</Txt>
    </View>
  );
}

const s = StyleSheet.create({
  panel: { borderRadius: 16, padding: 16 },
  stitch: { position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
});
