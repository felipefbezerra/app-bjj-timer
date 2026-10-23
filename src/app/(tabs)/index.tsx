import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Belt } from '@/components/belt';
import { IconPlay } from '@/components/icons';
import { PositionsSheet } from '@/components/positions';
import { Sheet, SheetActions, Stepper } from '@/components/sheet';
import { Label, Panel, PrimaryButton, Screen, Split, Stat, Txt, useWide } from '@/components/ui';
import { newRun, setPendingRun } from '@/lib/runner';
import { Sound } from '@/lib/sound';
import { buildSequence, fmtClock, totalSeconds, type CombateConfig } from '@/lib/sequence';
import { presetsFor, useStore } from '@/lib/store';
import { beltLook, useC } from '@/lib/theme';

export default function Combate() {
  const st = useStore();
  const C = useC();
  const b = beltLook(st.profile.belt, C);
  const presets = presetsFor(st.profile.belt, st.custom);
  const sel = presets.find(p => p.id === st.preset) ?? presets[0];
  const c = sel.config;
  const [edit, setEdit] = useState<CombateConfig | null>(null);
  const wide = useWide();
  const [picking, setPicking] = useState(false);

  // Mudar o treino escolhido salva no "Meu treino", como no Ajustar.
  const save = (cfg: CombateConfig) => st.set({ custom: cfg, preset: 'custom' });

  const start = () => {
    const seq = buildSequence('combate', c);
    if (!seq.length) return;
    Sound.prime();
    setPendingRun(newRun('combate', `${sel.kicker} ${sel.big}`, seq));
    router.push('/treino');
  };

  const greeting = st.profile.name ? `Oss, ${st.profile.name}` : 'Oss!';
  const degreeTxt = st.profile.degrees ? `${st.profile.degrees} ${st.profile.degrees === 1 ? 'grau' : 'graus'}` : 'Lisa';

  return (
    <Screen>
      <Split left={<>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }}>
          <View style={{ gap: 2 }}>
            <Label size={15}>{greeting}</Label>
            <Txt f="bold" size={30} caps track={0.02}>Combate</Txt>
          </View>
          <Pressable onPress={() => router.navigate('/treinos')} accessibilityLabel="Ver perfil" style={{ alignItems: 'flex-end', gap: 6 }}>
            <Belt belt={st.profile.belt} degrees={st.profile.degrees} height={14} width={88} small />
            <Txt f="med" size={13} color={C.muted} caps track={0.1}>{b.name} · {degreeTxt}</Txt>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}><Label>Escolha o treino</Label></View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 }}>
          {presets.map(p => {
            const on = p.id === sel.id;
            return (
              <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => st.set({ preset: p.id })}
                style={{ width: '48.5%', minHeight: 150, borderRadius: 16, padding: 16, gap: 10, backgroundColor: on ? b.accent : C.panel }}>
                <View pointerEvents="none" style={{ position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: on ? 'rgba(0,0,0,.18)' : C.stitch }} />
                <Txt f="semi" size={13} color={on ? b.ink : C.muted} caps track={0.12}>{p.kicker}</Txt>
                <Txt f="num" size={40} color={on ? b.ink : C.fg} style={{ lineHeight: 46 }}>{p.big}</Txt>
                <View style={{ marginTop: 'auto' }}>
                  <Txt f="med" size={15} color={on ? b.ink : C.soft}>{p.lines[0]}</Txt>
                  <Txt f="med" size={15} color={on ? b.ink : C.soft}>{p.lines[1]}</Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      </>} right={<>
        <Panel style={{ marginHorizontal: 20, marginLeft: wide ? 0 : 20, marginTop: wide ? 18 : 10, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>{sel.kicker} {sel.big}</Label>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setEdit({ ...c })}>
              <Txt f="semi" size={15} color={b.accent} caps track={0.08}>Ajustar</Txt>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Stat value={fmtClock(c.prep)} label="Preparar" color={C.prep} />
            <Stat value={fmtClock(c.work)} label="Luta" color={C.work} />
            <Stat value={c.rest ? fmtClock(c.rest) : '—'} label="Descanso" color={C.rest} />
            <Stat value={String(c.rounds)} label="Voltas" />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Escolher posições" onPress={() => setPicking(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Label>Posições</Label>
              <Txt f="med" size={16} color={c.themes.length ? C.fg : C.muted} numberOfLines={1}>{c.themes.length ? c.themes.join(', ') : 'Sem posição definida'}</Txt>
            </View>
            <Txt f="semi" size={15} color={b.accent} caps track={0.08}>{!c.themes.length ? 'Escolher' : c.themeOrder === 'rand' ? 'Sorteadas' : 'Em ordem'}</Txt>
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
            <Label>Duração total</Label>
            <Txt f="med" size={14} caps track={0.1}>{fmtClock(totalSeconds(buildSequence('combate', c)))}</Txt>
          </View>
        </Panel>

        <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingTop: 16 }}>
          <PrimaryButton label="Começar treino" icon={<IconPlay color={C.ink} />} onPress={start} />
        </View>
      </>} flexLeft={1.25} />

      {picking && (
        <PositionsSheet themes={c.themes} order={c.themeOrder} custom={st.positions} accent={b.accent} ink={b.ink}
          onClose={() => setPicking(false)} onCustom={positions => st.set({ positions })}
          onSave={(themes, themeOrder) => { save({ ...c, themes, themeOrder }); setPicking(false); }} />
      )}

      <Sheet open={!!edit} title="Ajustar treino" onClose={() => setEdit(null)}
        actions={<SheetActions onCancel={() => setEdit(null)} onOk={() => { if (edit) save(edit); setEdit(null); }} okLabel="Guardar" />}>
        {edit && <>
          <Stepper label="Preparar" color={C.prep} value={fmtClock(edit.prep)} onMinus={() => setEdit({ ...edit, prep: Math.max(0, edit.prep - 5) })} onPlus={() => setEdit({ ...edit, prep: edit.prep + 5 })} />
          <Stepper label="Luta" color={C.work} value={fmtClock(edit.work)} onMinus={() => setEdit({ ...edit, work: Math.max(30, edit.work - 30) })} onPlus={() => setEdit({ ...edit, work: edit.work + 30 })} />
          <Stepper label="Descanso" color={C.rest} value={fmtClock(edit.rest)} onMinus={() => setEdit({ ...edit, rest: Math.max(0, edit.rest - 15) })} onPlus={() => setEdit({ ...edit, rest: edit.rest + 15 })} />
          <Stepper label="Voltas" value={String(edit.rounds)} onMinus={() => setEdit({ ...edit, rounds: Math.max(1, edit.rounds - 1) })} onPlus={() => setEdit({ ...edit, rounds: Math.min(99, edit.rounds + 1) })} />
          <Stepper label="Relaxe no fim" color={C.relax} value={fmtClock(edit.relax)} onMinus={() => setEdit({ ...edit, relax: Math.max(0, edit.relax - 30) })} onPlus={() => setEdit({ ...edit, relax: edit.relax + 30 })} />
          <Txt f="reg" size={14} color={C.muted}>Os ajustes ficam salvos no card “Meu treino”.</Txt>
        </>}
      </Sheet>
    </Screen>
  );
}
