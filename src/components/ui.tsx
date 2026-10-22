import type { ReactNode } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F, TEXTURES } from '@/lib/theme';

type TxtProps = TextProps & { f?: keyof typeof F; size?: number; color?: string; caps?: boolean; track?: number; style?: StyleProp<TextStyle> };

// Texto na tipografia do app. caps + track dão o visual de etiqueta (maiúsculas espaçadas).
export function Txt({ f = 'med', size = 16, color = C.fg, caps, track, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: F[f], fontSize: size, color, letterSpacing: track ? size * track : undefined, textTransform: caps ? 'uppercase' : 'none' }, style]}
    />
  );
}

// Fundo de tecido de kimono, na cor da fase.
export function Fabric({ tone = 'escuro', children, style }: { tone?: keyof typeof TEXTURES; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ImageBackground source={TEXTURES[tone]} resizeMode="cover" style={[{ flex: 1, backgroundColor: C.ground }, style]}>
      {children}
    </ImageBackground>
  );
}

export function Screen({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Fabric>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: scroll ? 0 : 0 }}>{children}</View>
    </Fabric>
  );
}

export function Panel({ children, style, stitch }: { children: ReactNode; style?: StyleProp<ViewStyle>; stitch?: boolean }) {
  return (
    <View style={[s.panel, style]}>
      {stitch && <View pointerEvents="none" style={s.stitch} />}
      {children}
    </View>
  );
}

export function Label({ children, color = C.muted, size = 14 }: { children: ReactNode; color?: string; size?: number }) {
  return <Txt f="med" size={size} color={color} caps track={0.13}>{children}</Txt>;
}

export function PrimaryButton({ label, onPress, icon, height = 64, light = true }: { label: string; onPress: () => void; icon?: ReactNode; height?: number; light?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.primary, { height, borderRadius: height / 2, backgroundColor: light ? C.fg : 'transparent', borderWidth: light ? 0 : 1, borderColor: C.line2, opacity: pressed ? 0.85 : 1 }]}>
      {icon}
      <Txt f="bold" size={height > 56 ? 22 : 16} color={light ? C.ink : C.fg} caps track={height > 56 ? 0.12 : 0.08} numberOfLines={1} adjustsFontSizeToFit>{label}</Txt>
    </Pressable>
  );
}

export function IconButton({ onPress, label, children, size = 44, border = 'rgba(243,241,234,.25)' }: { onPress: () => void; label: string; children: ReactNode; size?: number; border?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      {children}
    </Pressable>
  );
}

// Valor grande com rótulo pequeno embaixo (tempos, contagens).
export function Stat({ value, label, color = C.fg, size = 22, align = 'center' }: { value: string; label: string; color?: string; size?: number; align?: 'center' | 'flex-start' }) {
  return (
    <View style={{ alignItems: align, gap: 3, flex: 1 }}>
      <Txt f="numMed" size={size} color={color}>{value}</Txt>
      <Txt f="med" size={12} color={C.muted} caps track={0.1}>{label}</Txt>
    </View>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: C.panel, borderRadius: 16, padding: 16 },
  stitch: { position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.10)' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
});
