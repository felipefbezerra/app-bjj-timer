import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { blockColor, blockSeconds, blockTarget, BLOCK_NAME, doneFromRun, doneLine, type Block } from '@/lib/plano';
import { type Run } from '@/lib/runner';
import { fmtClock } from '@/lib/sequence';
import { useStore } from '@/lib/store';
import { DARK as C, F } from '@/lib/theme';
import { IconCheck } from './icons';
import { PlanBar } from './plano';
import { Fabric, Label, Panel, PrimaryButton, Txt } from './ui';

const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function planned(b: Block) {
  switch (b.kind) {
    case 'drills': return `${b.items.length} ${b.items.length === 1 ? 'drill' : 'drills'}`;
    case 'posicao': return `${b.rounds} ${b.rounds === 1 ? 'volta' : 'voltas'}`;
    case 'combates': return `${b.rounds} de ${fmtClock(b.work)}`;
    default: return fmtClock(b.dur);
  }
}

// Fim de um plano: o que foi planejado e o que foi feito, bloco a bloco, para corrigir e salvar nos treinos.
export function Resumo({ run, onClose, landscape }: { run: Run; onClose: () => void; landscape: boolean }) {
  const st = useStore();
  const insets = useSafeAreaInsets();
  const plan = run.plan!;
  const [done, setDone] = useState(() => doneFromRun(plan, run.seq, run.counted));
  const [note, setNote] = useState('');

  const total = run.seq.reduce((a, x) => a + x.dur, 0);
  const elapsed = Math.round(run.seq.slice(0, run.i).reduce((a, x) => a + x.dur, 0) + (run.seq[run.i].dur - Math.max(0, run.remaining)));
  const d = new Date(run.startedAt);
  const setAt = (i: number, v: number) => setDone(done.map((x, j) => (j === i ? Math.max(0, Math.min(blockTarget(plan.blocks[i]), v)) : x)));

  const save = () => {
    const themes: string[] = [];
    plan.blocks.forEach((b, bi) => {
      if (b.kind === 'drills') b.items.slice(0, done[bi]).forEach(x => { if (!themes.includes(x.name)) themes.push(x.name); });
    });
    run.counted.forEach(i => { const s = run.seq[i]; if (s.theme && s.bi !== undefined && plan.blocks[s.bi]?.kind === 'posicao' && !themes.includes(s.theme)) themes.push(s.theme); });
    const rounds = plan.blocks.reduce((a, b, i) => a + (b.kind === 'posicao' || b.kind === 'combates' ? done[i] : 0), 0);
    st.addSession({ t: run.startedAt, mode: 'plano', work: elapsed, rounds, themes, done: plan.blocks.every((b, i) => done[i] >= blockTarget(b)), label: plan.name,
      planned: total, note: note.trim() || undefined });
    onClose();
  };

  const summary = (
    <>
      <View style={{ gap: 4 }}>
        <Label size={15}>{`${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} · ${plan.name}`}</Label>
        <Txt f="bold" size={landscape ? 36 : 44} caps style={{ lineHeight: landscape ? 38 : 46 }}>Planejado x feito</Txt>
      </View>
      <Panel stitch style={{ borderRadius: 18, padding: 20, gap: 14 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Txt f="med" size={14} color={C.muted} caps track={0.12}>Planejado</Txt>
            <Txt f="numMed" size={24}>{fmtClock(total)}</Txt>
          </View>
          <PlanBar plan={plan} />
        </View>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Txt f="med" size={14} color={C.muted} caps track={0.12}>Feito</Txt>
            <Txt f="num" size={30} color={C.work}>{fmtClock(elapsed)}</Txt>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: C.line, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (elapsed / Math.max(1, total)) * 100)}%`, height: '100%', backgroundColor: C.work }} />
          </View>
        </View>
        <Txt f="med" size={16} color={C.soft}>{doneLine(plan, done)}</Txt>
      </Panel>
    </>
  );

  const checklist = (
    <>
      <View style={{ gap: 8 }}>
        <Label>O que foi feito</Label>
        {plan.blocks.map((b, i) => {
          const color = blockColor(b.kind, true);
          const target = blockTarget(b);
          const full = done[i] >= target, none = done[i] === 0;
          const toggle = target === 1;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingLeft: 14, borderRadius: 14, backgroundColor: C.panel }}>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: full }} accessibilityLabel={BLOCK_NAME[b.kind]} hitSlop={8} onPress={() => setAt(i, full ? 0 : target)}
                style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: none ? C.line2 : color, backgroundColor: full ? color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {full && <IconCheck color={C.ink} size={16} />}
                {!full && !none && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />}
              </Pressable>
              <View style={{ flex: 1, gap: 1 }}>
                <Txt f="semi" size={20} caps numberOfLines={1} color={none ? C.muted : C.fg}>{BLOCK_NAME[b.kind]}</Txt>
                <Txt f="med" size={14} color={C.muted}>{`Planejado: ${planned(b)}`}</Txt>
              </View>
              {toggle ? (
                <Pressable accessibilityRole="button" onPress={() => setAt(i, full ? 0 : 1)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: C.line2 }}>
                  <Txt f={full ? 'numMed' : 'semi'} size={16} color={full ? C.fg : C.muted} caps>{full ? fmtClock(blockSeconds(b)) : 'Pulado'}</Txt>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Step label="−" a11y={`Menos ${BLOCK_NAME[b.kind]}`} onPress={() => setAt(i, done[i] - 1)} />
                  <Txt f="numMed" size={18} style={{ minWidth: 40, textAlign: 'center' }}>{`${done[i]}/${target}`}</Txt>
                  <Step label="+" a11y={`Mais ${BLOCK_NAME[b.kind]}`} onPress={() => setAt(i, done[i] + 1)} />
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ gap: 6 }}>
        <Label>Como foi</Label>
        <TextInput value={note} onChangeText={setNote} multiline maxLength={400} placeholder="Ex.: cansei no 5º combate, a passagem saiu bem" placeholderTextColor={C.muted}
          accessibilityLabel="Como foi o treino"
          style={{ fontFamily: F.med, fontSize: 18, color: C.fg, backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10, minHeight: 80, textAlignVertical: 'top' }} />
      </View>
      <View style={{ gap: 10 }}>
        <PrimaryButton label="Salvar nos treinos" height={60} onPress={save} />
        <PrimaryButton label="Voltar ao plano" height={52} light={false} onPress={onClose} />
      </View>
    </>
  );

  const pad = { paddingTop: insets.top + (landscape ? 16 : 24), paddingBottom: Math.max(24, insets.bottom + 10), paddingLeft: Math.max(20, insets.left + 12), paddingRight: Math.max(20, insets.right + 12) };
  return (
    <Fabric>
      {landscape ? (
        <View style={{ flex: 1, flexDirection: 'row', gap: 20, width: '100%', maxWidth: 1100, alignSelf: 'center' }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ ...pad, paddingRight: 0, gap: 16 }}>{summary}</ScrollView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ ...pad, paddingLeft: 0, gap: 16 }} keyboardShouldPersistTaps="handled">{checklist}</ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ ...pad, gap: 18, width: '100%', maxWidth: 640, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">{summary}{checklist}</ScrollView>
      )}
    </Fabric>
  );
}

function Step({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={4}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 10, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Txt f="semi" size={22}>{label}</Txt>
    </Pressable>
  );
}
