import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useC } from '@/lib/theme';
import { Txt, useShort } from './ui';

// Folha que sobe de baixo para editar valores.
export function Sheet({ open, title, onClose, children, actions }: { open: boolean; title: string; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const C = useC();
  // Deitado ou em tela grande, a folha não estica de ponta a ponta e ocupa quase toda a altura.
  const short = useShort();
  return (
    <Modal visible={open} transparent animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.55)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={{ backgroundColor: C.dark ? C.panel : '#f6f4ee', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: short ? 14 : 20,
          paddingBottom: Math.max(short ? 12 : 20, insets.bottom + 8), maxHeight: short ? '94%' : '88%', gap: short ? 10 : 16, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
          <Txt f="title" size={short ? 20 : 24} caps>{title}</Txt>
          <ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          {actions}
        </View>
      </View>
    </Modal>
  );
}

// Linha com valor e botões − / +.
export function Stepper({ label, value, onMinus, onPlus, color }: { label: string; value: string; onMinus: () => void; onPlus: () => void; color?: string }) {
  const C = useC();
  const btn = (txt: string, fn: () => void, a11y: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={fn}
      style={({ pressed }) => ({ width: 52, height: 46, borderRadius: 12, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Txt f="semi" size={24}>{txt}</Txt>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt f="med" size={13} color={C.muted} caps track={0.1}>{label}</Txt>
        <Txt f="numMed" size={30} color={color ?? C.fg}>{value}</Txt>
      </View>
      {btn('−', onMinus, `Diminuir ${label}`)}
      {btn('+', onPlus, `Aumentar ${label}`)}
    </View>
  );
}

export function SheetActions({ onCancel, onOk, okLabel = 'OK' }: { onCancel: () => void; onOk: () => void; okLabel?: string }) {
  const C = useC();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={{ flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' }}>
        <Txt f="semi" size={18} caps track={0.1}>Cancelar</Txt>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOk} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: C.fg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt f="bold" size={18} color={C.ink} caps track={0.1}>{okLabel}</Txt>
      </Pressable>
    </View>
  );
}
