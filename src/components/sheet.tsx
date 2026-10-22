import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useC } from '@/lib/theme';
import { Txt } from './ui';

// Folha que sobe de baixo para editar valores.
export function Sheet({ open, title, onClose, children, actions }: { open: boolean; title: string; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const C = useC();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.55)' }} onPress={onClose} accessibilityLabel="Fechar" />
      <View style={{ backgroundColor: C.dark ? C.panel : '#f6f4ee', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 20, paddingBottom: Math.max(20, insets.bottom + 8), maxHeight: '88%', gap: 16 }}>
        <Txt f="bold" size={24} caps track={0.02}>{title}</Txt>
        <ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        {actions}
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
