import type { ReactNode } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F, textSize, TEXTURES, useC, type TextureKey } from '@/lib/theme';

type TxtProps = TextProps & { f?: keyof typeof F; size?: number; color?: string; caps?: boolean; track?: number; style?: StyleProp<TextStyle> };

// Texto na tipografia do app. caps + track dão o visual de etiqueta (maiúsculas espaçadas).
// "title" é a Anton dos títulos e nomes; num e numMed, a Oswald dos números; o resto é Inter.
export function Txt({ f = 'med', size = 16, color, caps, track, style, ...rest }: TxtProps) {
  const C = useC();
  const kind = f === 'title' ? 'title' : f === 'num' || f === 'numMed' ? 'num' : 'text';
  const fs = kind === 'title' ? Math.round(size * 0.95) : kind === 'text' ? textSize(size) : size;
  const tr = kind === 'title' ? 0.01 : kind === 'text' && track ? Math.min(track, 0.06) : track;
  return (
    <Text
      {...rest}
      style={[{ fontFamily: F[f], fontSize: fs, color: color ?? C.fg, letterSpacing: tr ? fs * tr : undefined, textTransform: caps ? 'uppercase' : 'none',
        lineHeight: kind === 'title' ? Math.round(fs * 1.3) : undefined }, style]}
    />
  );
}

// Fundo de tecido de kimono, na cor da fase.
export function Fabric({ tone, children, style }: { tone?: TextureKey; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const C = useC();
  return (
    <ImageBackground source={TEXTURES[tone ?? C.fabric]} resizeMode="cover" imageStyle={{ width: "100%", height: "100%" }} style={[{ flex: 1, backgroundColor: C.ground }, style]}>
      {children}
    </ImageBackground>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  // Laterais seguras para o entalhe da câmera com o celular deitado.
  return (
    <Fabric>
      <View style={{ flex: 1, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>{children}</View>
    </Fabric>
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
      <Txt f="bold" size={height > 56 ? 20 : 15} color={light ? C.ink : C.fg} caps track={0.04} numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1 }}>{label}</Txt>
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
