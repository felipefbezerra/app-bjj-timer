import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { IconHandle, IconPlay } from '@/components/icons';
import { Sheet, SheetActions, Stepper } from '@/components/sheet';
import { Label, Panel, PrimaryButton, Screen, Split, Stat, Txt, useWide } from '@/components/ui';
import { newRun, setPendingRun } from '@/lib/runner';
import { Sound } from '@/lib/sound';
import { buildSequence, CIRCUITO_PRESETS, fmtClock, totalSeconds, type CircuitoConfig, type Station } from '@/lib/sequence';
import { useStore } from '@/lib/store';
import { beltLook, F, useC } from '@/lib/theme';

type StationEdit = { index: number; st: Station };

function short(s: number) { return s < 60 ? `${s}s` : fmtClock(s); }

export default function Circuito() {
  const store = useStore();
  const preset = CIRCUITO_PRESETS.find(p => p.id === store.circuitoPreset);
  const c = preset?.config ?? store.circuito;
  const C = useC();
  const b = beltLook(store.profile.belt, C);
  const [times, setTimes] = useState<CircuitoConfig | null>(null);
  const [station, setStation] = useState<StationEdit | null>(null);
  const wide = useWide();

  // Mudar um circuito pronto salva no "Meu circuito", como no Combate.
  const save = (circuito: CircuitoConfig) => {
    if (JSON.stringify(circuito) === JSON.stringify(c)) return; // sem mudança: não troca o "Meu circuito"
    store.set({ circuito, circuitoPreset: 'custom' });
  };
  const cards = [
    ...CIRCUITO_PRESETS.map(p => ({ id: p.id, kicker: p.kicker, big: p.big, line: p.line })),
    { id: 'custom' as const, kicker: 'Meu circuito', big: `${store.circuito.stations.length}×${short(store.circuito.stations[0]?.dur ?? 40)}`, line: `${store.circuito.rounds} voltas · do seu jeito` },
  ];
  const drill = !!c.drill;

  const start = () => {
    const seq = buildSequence('circuito', c);
    if (!seq.length) return;
    Sound.prime();
    setPendingRun(newRun('circuito', preset?.kicker ?? 'Circuito', seq));
    router.push('/treino');
  };

  const saveStation = () => {
    if (!station) return;
    const name = station.st.name.trim() || `${drill ? 'Técnica' : 'Estação'} ${station.index + 1}`;
    const stations = [...c.stations];
    if (station.index >= stations.length) stations.push({ ...station.st, name });
    else stations[station.index] = { ...station.st, name };
    save({ ...c, stations });
    setStation(null);
  };
  const removeStation = () => {
    if (!station || c.stations.length <= 1) return;
    save({ ...c, stations: c.stations.filter((_, i) => i !== station.index) });
    setStation(null);
  };
  const move = (dir: -1 | 1) => {
    if (!station) return;
    const j = station.index + dir;
    if (j < 0 || j >= c.stations.length) return;
    const stations = [...c.stations];
    [stations[station.index], stations[j]] = [stations[j], stations[station.index]];
    save({ ...c, stations });
    setStation({ ...station, index: j });
  };

  const work = c.stations[0]?.dur ?? 40;
  // Com a tela larga, os circuitos prontos vão para a coluna da direita, junto das estações.
  const presetCards = (
    <>
      <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingTop: wide ? 18 : 6, paddingBottom: 6 }}><Label>Escolha o circuito</Label></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingBottom: 10 }}>
        {cards.map(p => {
          const on = p.id === store.circuitoPreset;
          return (
            <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => store.set({ circuitoPreset: p.id })}
              style={{ width: '48.5%', minHeight: 112, borderRadius: 16, padding: 14, paddingHorizontal: 16, gap: 6, backgroundColor: on ? b.accent : C.panel }}>
              <View pointerEvents="none" style={{ position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: on ? 'rgba(0,0,0,.18)' : C.stitch }} />
              <Txt f="semi" size={13} color={on ? b.ink : C.muted} caps track={0.12}>{p.kicker}</Txt>
              <Txt f="num" size={32} color={on ? b.ink : C.fg} style={{ lineHeight: 38 }}>{p.big}</Txt>
              <Txt f="med" size={15} color={on ? b.ink : C.soft} style={{ marginTop: 'auto' }}>{p.line}</Txt>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  // Com a tela larga, o botão fica embaixo dos tempos, sem precisar rolar a lista de estações.
  const startButton = (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      <PrimaryButton label="Começar circuito" icon={<IconPlay color={C.ink} />} onPress={start} />
    </View>
  );

  return (
    <Screen>
      <Split left={<>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }}>
          <View style={{ gap: 2 }}>
            <Label size={15}>Condicionamento e técnica</Label>
            <Txt f="bold" size={30} caps track={0.02}>Circuito</Txt>
          </View>
          <Txt f="numMed" size={22}>{fmtClock(totalSeconds(buildSequence('circuito', c)))}</Txt>
        </View>

        {!wide && presetCards}

        <Pressable onPress={() => setTimes({ ...c })} accessibilityRole="button" accessibilityLabel="Ajustar tempos do circuito">
          <Panel style={{ marginHorizontal: 20, marginTop: 6, flexDirection: 'row', paddingHorizontal: 10 }}>
            <Stat value={fmtClock(work)} label={drill ? 'Drill' : 'Exercício'} color={C.work} />
            <Stat value={fmtClock(c.rest)} label="Troca" color={C.rest} />
            <Stat value={String(c.rounds)} label="Voltas" />
            <Stat value={fmtClock(c.cycleRest)} label="Entre voltas" color={C.cycle} />
          </Panel>
        </Pressable>

        {wide && startButton}
      </>} right={<>
        {wide && presetCards}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingTop: 18, paddingBottom: 6 }}>
          <Label>{drill ? 'Técnicas' : 'Estações'}</Label><Label>{String(c.stations.length)}</Label>
        </View>

        <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, gap: 8 }}>
          {c.stations.map((x, i) => (
            <Pressable key={i} accessibilityRole="button" onPress={() => setStation({ index: i, st: { ...x } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.panel }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: b.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Txt f="num" size={17} color={b.ink}>{String(i + 1)}</Txt>
              </View>
              <Txt f="semi" size={22} caps style={{ flex: 1 }} numberOfLines={1}>{x.name}</Txt>
              <Txt f="numMed" size={18} color={C.muted}>{fmtClock(x.dur)}</Txt>
              <IconHandle />
            </Pressable>
          ))}
          {c.stations.length < 20 && (
            <Pressable accessibilityRole="button" onPress={() => setStation({ index: c.stations.length, st: { name: '', dur: work } })}
              style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line2, alignItems: 'center' }}>
              <Txt f="semi" size={18} color={b.accent} caps track={0.1}>{drill ? '+ Adicionar técnica' : '+ Adicionar estação'}</Txt>
            </Pressable>
          )}
        </View>

        {!wide && startButton}
      </>} />

      <Sheet open={!!times} title="Tempos do circuito" onClose={() => setTimes(null)}
        actions={<SheetActions onCancel={() => setTimes(null)} onOk={() => { if (times) save(times); setTimes(null); }} okLabel="Guardar" />}>
        {times && <>
          <Stepper label="Preparar" color={C.prep} value={fmtClock(times.prep)} onMinus={() => setTimes({ ...times, prep: Math.max(0, times.prep - 5) })} onPlus={() => setTimes({ ...times, prep: times.prep + 5 })} />
          <Stepper label={times.drill ? 'Drill (todas as técnicas)' : 'Exercício (todas as estações)'} color={C.work} value={fmtClock(times.stations[0]?.dur ?? 40)}
            onMinus={() => setTimes({ ...times, stations: times.stations.map(s => ({ ...s, dur: Math.max(10, s.dur - 5) })) })}
            onPlus={() => setTimes({ ...times, stations: times.stations.map(s => ({ ...s, dur: s.dur + 5 })) })} />
          <Stepper label={times.drill ? 'Troca de técnica' : 'Troca de estação'} color={C.rest} value={fmtClock(times.rest)} onMinus={() => setTimes({ ...times, rest: Math.max(0, times.rest - 5) })} onPlus={() => setTimes({ ...times, rest: times.rest + 5 })} />
          <Stepper label="Voltas" value={String(times.rounds)} onMinus={() => setTimes({ ...times, rounds: Math.max(1, times.rounds - 1) })} onPlus={() => setTimes({ ...times, rounds: Math.min(20, times.rounds + 1) })} />
          <Stepper label="Descanso entre voltas" color={C.cycle} value={fmtClock(times.cycleRest)} onMinus={() => setTimes({ ...times, cycleRest: Math.max(0, times.cycleRest - 15) })} onPlus={() => setTimes({ ...times, cycleRest: times.cycleRest + 15 })} />
        </>}
      </Sheet>

      <Sheet open={!!station} title={station && station.index < c.stations.length ? `${drill ? 'Técnica' : 'Estação'} ${station.index + 1}` : drill ? 'Nova técnica' : 'Nova estação'} onClose={() => setStation(null)}
        actions={<SheetActions onCancel={() => setStation(null)} onOk={saveStation} okLabel="Guardar" />}>
        {station && <>
          <View style={{ gap: 6 }}>
            <Label size={13}>{drill ? 'Técnica' : 'Exercício'}</Label>
            <TextInput value={station.st.name} onChangeText={name => setStation({ ...station, st: { ...station.st, name } })} maxLength={40}
              placeholder={drill ? 'Ex.: Armlock da guarda' : 'Ex.: Sprawl, burpee'} placeholderTextColor={C.muted}
              style={{ fontFamily: F.med, fontSize: 20, color: C.fg, backgroundColor: C.ground, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10 }} />
          </View>
          <Stepper label="Duração" color={C.work} value={fmtClock(station.st.dur)}
            onMinus={() => setStation({ ...station, st: { ...station.st, dur: Math.max(10, station.st.dur - 5) } })}
            onPlus={() => setStation({ ...station, st: { ...station.st, dur: station.st.dur + 5 } })} />
          {station.index < c.stations.length && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['↑ Subir', () => move(-1)], ['↓ Descer', () => move(1)], ['Remover', removeStation]] as const).map(([t, fn]) => (
                <Pressable key={t} accessibilityRole="button" onPress={fn} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.line, alignItems: 'center' }}>
                  <Txt f="semi" size={16} color={t === 'Remover' ? C.rest : C.fg} caps track={0.06}>{t}</Txt>
                </Pressable>
              ))}
            </View>
          )}
        </>}
      </Sheet>
    </Screen>
  );
}
