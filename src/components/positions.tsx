import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { POSITIONS } from '@/lib/sequence';
import { F, useC } from '@/lib/theme';
import { Sheet } from './sheet';
import { Label, Txt } from './ui';

type Order = 'seq' | 'rand';
type Props = {
  themes: string[];
  order: Order;
  custom: string[];
  accent: string;
  ink: string;
  onClose: () => void;
  onSave: (themes: string[], order: Order) => void;
  onCustom: (custom: string[]) => void;
};

// Escolha das posições que aparecem grandes na tela, uma por volta, em ordem ou sorteadas.
// Fica montada só enquanto aberta, para começar sempre com a escolha atual.
export function PositionsSheet({ themes, order, custom, accent, ink, onClose, onSave, onCustom }: Props) {
  const C = useC();
  const [pick, setPick] = useState(themes);
  const [ord, setOrd] = useState<Order>(order);
  const [text, setText] = useState('');

  const all = [...POSITIONS, ...custom];
  pick.forEach(t => { if (!all.includes(t)) all.push(t); });

  const toggle = (t: string) => setPick(pick.includes(t) ? pick.filter(x => x !== t) : [...pick, t]);
  const remove = (t: string) => { onCustom(custom.filter(x => x !== t)); setPick(pick.filter(x => x !== t)); };
  const add = () => {
    const t = text.trim().replace(/\s+/g, ' ');
    if (!t) return;
    const known = all.find(x => x.toLowerCase() === t.toLowerCase());
    if (!known) onCustom([...custom, t]);
    const name = known ?? t;
    if (!pick.includes(name)) setPick([...pick, name]);
    setText('');
  };

  const actions = (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable accessibilityRole="button" onPress={() => onSave([], ord)} style={{ flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' }}>
        <Txt f="semi" size={18} caps track={0.1}>Desligar</Txt>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onSave(pick, ord)} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: C.fg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt f="bold" size={18} color={C.ink} caps track={0.1}>Guardar</Txt>
      </Pressable>
    </View>
  );

  return (
    <Sheet open title="Posições" onClose={onClose} actions={actions}>
      <Txt f="reg" size={15} color={C.muted}>Toque para escolher. A posição aparece grande na tela e é falada no começo de cada volta.</Txt>

      <View style={{ flexDirection: 'row', gap: 6, backgroundColor: C.ground, borderRadius: 12, padding: 4 }}>
        {([['seq', 'Em ordem'], ['rand', 'Sortear']] as [Order, string][]).map(([k, t]) => (
          <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: ord === k }} onPress={() => setOrd(k)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: ord === k ? C.line2 : 'transparent' }}>
            <Txt f="semi" size={16} color={ord === k ? C.fg : C.muted} caps>{t}</Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {all.map(t => {
          const on = pick.includes(t), mine = custom.includes(t);
          return (
            <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => toggle(t)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingLeft: 14, paddingRight: mine ? 8 : 14, borderRadius: 999,
                borderWidth: 1, borderColor: on ? accent : C.line2, backgroundColor: on ? accent : 'transparent' }}>
              <Txt f="semi" size={16} color={on ? ink : C.fg} caps track={0.04}>{on && ord === 'seq' ? `${pick.indexOf(t) + 1}. ` : ''}{t}</Txt>
              {mine && (
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${t}`} hitSlop={8} onPress={() => remove(t)}
                  style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? 'rgba(0,0,0,.15)' : C.line }}>
                  <Txt f="semi" size={13} color={on ? ink : C.muted}>✕</Txt>
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 6 }}>
        <Label size={13}>Nova posição</Label>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={text} onChangeText={setText} onSubmitEditing={add} maxLength={32} returnKeyType="done" placeholder="Ex.: Berimbolo" placeholderTextColor={C.muted}
            style={{ flex: 1, minWidth: 0, fontFamily: F.med, fontSize: 18, color: C.fg, backgroundColor: C.ground, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10 }} />
          <Pressable accessibilityRole="button" onPress={add} style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
            <Txt f="semi" size={16} caps track={0.06}>Adicionar</Txt>
          </Pressable>
        </View>
      </View>

    </Sheet>
  );
}
