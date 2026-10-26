import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ImportSheet } from '@/components/compartilhar';
import { IconPlay } from '@/components/icons';
import { PlanBar, startPlan } from '@/components/plano';
import { Label, Panel, PrimaryButton, Screen, Split, Txt, useWide } from '@/components/ui';
import { blockChip, hmParts, nextAt, planLine, planSeconds, whenLabel, type Plan } from '@/lib/plano';
import { useStore } from '@/lib/store';
import { beltLook, useC } from '@/lib/theme';

// O próximo treino é o plano marcado mais perto de agora; sem nenhum marcado, o último mexido.
function pickNext(plans: Plan[], now: Date) {
  const dated = plans.map(p => ({ p, t: nextAt(p, now) })).filter(x => x.t !== null).sort((a, b) => a.t! - b.t!);
  return dated[0]?.p ?? [...plans].sort((a, b) => b.updated - a.updated)[0];
}

export default function Planejar() {
  const st = useStore();
  const C = useC();
  const b = beltLook(st.profile.belt, C);
  const wide = useWide();
  const [importing, setImporting] = useState(false);
  const now = new Date();
  const next = st.plans.length ? pickNext(st.plans, now) : undefined;
  const others = st.plans.filter(p => p !== next).sort((a, z) => (nextAt(a, now) ?? Infinity) - (nextAt(z, now) ?? Infinity) || z.updated - a.updated);
  const edit = (id: string) => router.push({ pathname: '/plano', params: { id } });

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, gap: 2 }}>
      <Label size={15}>Monte a aula</Label>
      <Txt f="title" size={30} caps>Planejamento</Txt>
    </View>
  );

  const nextCard = next ? (() => {
    const [n, unit] = hmParts(planSeconds(next));
    return (
      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <Label>Próximo treino</Label>
        <Panel stitch style={{ borderRadius: 18, padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt f="title" size={30} caps numberOfLines={2}>{next.name || 'Plano sem nome'}</Txt>
              <Txt f="med" size={16} color={C.muted} caps track={0.1}>{whenLabel(next, now)}</Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Txt f="num" size={40} style={{ lineHeight: 46 }}>{n}</Txt>
              <Txt f="med" size={16} color={C.muted} caps>{unit}</Txt>
            </View>
          </View>
          <PlanBar plan={next} />
          <Txt f="med" size={16} color={C.soft}>{next.blocks.map(blockChip).join('  ·  ') || 'Nenhum bloco ainda'}</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><PrimaryButton label="Editar" height={52} light={false} onPress={() => edit(next.id)} /></View>
            <View style={{ flex: 1 }}><PrimaryButton label="Começar" height={52} icon={<IconPlay color={C.ink} size={18} />} onPress={() => startPlan(next)} /></View>
          </View>
        </Panel>
      </View>
    );
  })() : (
    <View style={{ paddingHorizontal: 20 }}>
      <Panel stitch style={{ borderRadius: 18, padding: 18, gap: 10 }}>
        <Txt f="title" size={26} caps>Nenhum plano ainda</Txt>
        <Txt f="reg" size={17} color={C.soft}>Monte a aula em blocos: aquecimento, drills, posição específica, combates e volta à calma. O app calcula o tempo total e roda tudo em sequência, falando cada drill e posição. Recebeu um plano? Toque em “Importar”.</Txt>
      </Panel>
    </View>
  );

  const list = (
    <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingTop: wide ? 18 : 22, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Label>Meus planos</Label><Label>{String(st.plans.length)}</Label>
      </View>
      {others.map(p => {
        const [n, unit] = hmParts(planSeconds(p));
        return (
          <Pressable key={p.id} accessibilityRole="button" accessibilityHint="Editar plano" onPress={() => edit(p.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.panel }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt f="title" size={22} caps numberOfLines={1}>{p.name || 'Plano sem nome'}</Txt>
              <Txt f="med" size={15} color={C.muted} numberOfLines={1}>{planLine(p)}</Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <Txt f="numMed" size={22}>{n}</Txt>
              <Txt f="med" size={13} color={C.muted} caps>{unit}</Txt>
            </View>
            <Txt size={22} color={C.muted}>›</Txt>
          </Pressable>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['+ Novo plano', () => router.push({ pathname: '/plano', params: { id: 'novo' } })], ['↓ Importar', () => setImporting(true)]] as const).map(([t, fn]) => (
          <Pressable key={t} accessibilityRole="button" onPress={fn}
            style={{ flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line2, alignItems: 'center' }}>
            <Txt f="semi" size={18} color={b.accent} caps track={0.1}>{t}</Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen>
      <Split left={<>{header}{nextCard}</>} right={list} />
      {importing && <ImportSheet onClose={() => setImporting(false)} onImported={() => setImporting(false)} />}
    </Screen>
  );
}
