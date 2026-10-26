import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ShareSheet } from '@/components/compartilhar';
import { IconBack, IconHandle, IconPlay, IconShare } from '@/components/icons';
import { PlanBar, startPlan } from '@/components/plano';
import { PositionsSheet } from '@/components/positions';
import { Sheet, SheetActions, Stepper } from '@/components/sheet';
import { IconButton, Label, Panel, PrimaryButton, Screen, Split, Stat, Txt, useWide } from '@/components/ui';
import {
  BLOCK_NAME, blockColor, blockSeconds, clockTime, dayLabel, hmParts, newBlock, newPlan, nextAt, planSeconds, planStats, repeatLabel, upcoming,
  type Block, type BlockKind, type DrillItem, type Plan,
} from '@/lib/plano';
import { fmtClock } from '@/lib/sequence';
import { useStore } from '@/lib/store';
import { beltLook, F, textSize, useC, type Palette } from '@/lib/theme';

type BlockEdit = { index: number; block: Block };
type DayEdit = { weekday: number | null; time: number; weekly: boolean };

const KINDS: BlockKind[] = ['aquecimento', 'drills', 'posicao', 'combates', 'calma'];
const DAYS: [number | null, string][] = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom'], [null, 'Sem dia']];

const input = (C: Palette, size = 20) => ({ fontFamily: F.med, fontSize: textSize(size), color: C.fg, backgroundColor: C.ground, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10 });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Editar um plano de treino: dia, blocos, observações. Voltar também guarda o que mudou.
export default function PlanoScreen() {
  const st = useStore();
  const C = useC();
  const b = beltLook(st.profile.belt, C);
  const wide = useWide();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [initial] = useState(() => st.plans.find(p => p.id === id) ?? newPlan());
  const isNew = !st.plans.some(p => p.id === initial.id);
  const [draft, setDraft] = useState<Plan>(initial);
  const [editing, setEditing] = useState<BlockEdit | null>(null);
  const [adding, setAdding] = useState(false);
  const [day, setDay] = useState<DayEdit | null>(null);
  const [times, setTimes] = useState<{ prep: number; change: number } | null>(null);
  const [picking, setPicking] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState<Plan | null>(null);

  // Ao sair da tela (voltar, gesto ou botão do Android), guarda se algo mudou.
  const draftRef = useRef(draft);
  const savedRef = useRef(JSON.stringify(initial));
  const saveRef = useRef(st.savePlan);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { saveRef.current = st.savePlan; }, [st.savePlan]);
  useEffect(() => () => {
    const d = draftRef.current;
    if (savedRef.current && JSON.stringify(d) !== savedRef.current) saveRef.current({ ...d, updated: Date.now() });
  }, []);

  const persist = () => {
    const p = { ...draft, name: draft.name.trim() || 'Plano sem nome', updated: Date.now() };
    st.savePlan(p);
    savedRef.current = JSON.stringify(p);
    draftRef.current = p;
    return p;
  };
  const back = () => router.canGoBack() ? router.back() : router.replace('/planejar');
  const save = () => { persist(); back(); };
  // O treino abre por cima; ao terminar, volta para o plano.
  const start = () => startPlan(persist());
  const remove = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    savedRef.current = '';
    st.removePlan(draft.id);
    back();
  };

  const setBlock = (i: number, block: Block) => setDraft({ ...draft, blocks: draft.blocks.map((x, j) => (j === i ? block : x)) });
  const saveEditing = () => {
    if (!editing) return;
    let block = editing.block;
    if (block.kind === 'drills') block = { ...block, items: block.items.map((x, i) => ({ ...x, name: x.name.trim() || `Drill ${i + 1}` })) };
    setBlock(editing.index, block);
    setEditing(null);
  };
  const moveBlock = (dir: -1 | 1) => {
    if (!editing) return;
    const j = editing.index + dir;
    if (j < 0 || j >= draft.blocks.length) return;
    const blocks = [...draft.blocks];
    [blocks[editing.index], blocks[j]] = [blocks[j], blocks[editing.index]];
    setDraft({ ...draft, blocks });
    setEditing({ ...editing, index: j });
  };
  const removeBlock = () => {
    if (!editing) return;
    setDraft({ ...draft, blocks: draft.blocks.filter((_, i) => i !== editing.index) });
    setEditing(null);
  };
  const addBlock = (kind: BlockKind) => {
    const block = newBlock(kind);
    setDraft({ ...draft, blocks: [...draft.blocks, block] });
    setAdding(false);
    setEditing({ index: draft.blocks.length, block });
  };

  const saveDay = () => {
    if (!day) return;
    setDraft({ ...draft, ...day, once: day.weekday !== null && !day.weekly ? upcoming(day.weekday, day.time) : undefined });
    setDay(null);
  };

  const total = planSeconds(draft);
  const [tn, tu] = hmParts(total);
  const stats = planStats(draft);
  const when = nextAt(draft);

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton label="Voltar" onPress={back}><IconBack color={C.fg} /></IconButton>
        <View style={{ flex: 1 }}><Label size={15}>{draft.from ? `Plano de ${draft.from.name}` : 'Plano de treino'}</Label></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar plano" onPress={() => setSharing(persist())} hitSlop={6}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: b.accent, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <IconShare color={b.ink} />
        </Pressable>
      </View>
      <TextInput value={draft.name} onChangeText={name => setDraft({ ...draft, name })} maxLength={40} placeholder="Nome do plano" placeholderTextColor={C.muted}
        accessibilityLabel="Nome do plano" style={{ fontFamily: F.title, fontSize: 30, color: C.fg, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.line }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Escolher dia e horário" onPress={() => setDay({ weekday: draft.weekday, time: draft.time, weekly: draft.weekly })}
        style={{ flexDirection: 'row', gap: 10 }}>
        <Pill label="Dia" value={draft.weekday === null ? 'Sem dia' : `${when !== null ? dayLabel(when) : 'Já passou'} · ${clockTime(draft.time)}`} />
        <Pill label="Repetir" value={repeatLabel(draft)} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Ajustar preparar e troca entre blocos" onPress={() => setTimes({ prep: draft.prep, change: draft.change })}>
        <Panel stitch style={{ borderRadius: 18, gap: 14, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Label>Duração total</Label>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Txt f="num" size={48} style={{ lineHeight: 54 }}>{tn}</Txt>
                <Txt f="med" size={18} color={C.muted} caps>{tu}</Txt>
              </View>
            </View>
            <Txt f="med" size={14} color={C.muted} caps track={0.08} style={{ textAlign: 'right' }}>{`Preparar ${fmtClock(draft.prep)}\nTroca ${fmtClock(draft.change)}`}</Txt>
          </View>
          <PlanBar plan={draft} />
          <View style={{ flexDirection: 'row' }}>
            <Stat value={String(stats.drills)} label="Drills" align="flex-start" />
            <Stat value={String(stats.fights)} label="Combates" align="flex-start" />
            <Stat value={`${Math.round(stats.fight / 60)} min`} label="De luta" align="flex-start" />
          </View>
        </Panel>
      </Pressable>
    </View>
  );

  const blocks = (
    <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingTop: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Label>Blocos do treino</Label><Label>{String(draft.blocks.length)}</Label>
      </View>
      {draft.blocks.map((blk, i) => (
        <BlockCard key={i} index={i} block={blk} C={C} onEdit={() => setEditing({ index: i, block: blk })}
          onPositions={() => setPicking(i)}
          onAddDrill={() => blk.kind === 'drills' && setEditing({ index: i, block: { ...blk, items: [...blk.items, { name: '', reps: 2, dur: blk.items[0]?.dur ?? 180 }] } })} />
      ))}
      {draft.blocks.length < 12 && (
        <Pressable accessibilityRole="button" onPress={() => setAdding(true)}
          style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line2, alignItems: 'center' }}>
          <Txt f="semi" size={18} color={b.accent} caps track={0.1}>+ Adicionar bloco</Txt>
        </Pressable>
      )}
    </View>
  );

  const footer = (
    <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 20 : 20, paddingTop: 18, gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Label>Observações</Label>
        <TextInput value={draft.notes} onChangeText={notes => setDraft({ ...draft, notes })} multiline maxLength={400} placeholder="Ex.: foco da semana em passagem de guarda" placeholderTextColor={C.muted}
          accessibilityLabel="Observações" style={[input(C, 18), { minHeight: 84, textAlignVertical: 'top' }]} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><PrimaryButton label="Salvar" height={60} light={false} onPress={save} /></View>
        <View style={{ flex: 2 }}><PrimaryButton label="Começar plano" height={60} icon={<IconPlay color={C.ink} size={18} />} onPress={start} /></View>
      </View>
      {!isNew && (
        <Pressable accessibilityRole="button" onPress={remove} style={{ alignItems: 'center', padding: 10 }}>
          <Txt f="semi" size={16} color={C.rest} caps track={0.1}>{confirmDelete ? 'Toque de novo para excluir' : 'Excluir plano'}</Txt>
        </Pressable>
      )}
    </View>
  );

  const eb = editing?.block;

  return (
    <Screen>
      <Split left={<>{header}{wide && footer}</>} right={<>{blocks}{!wide && footer}</>} />

      <Sheet open={adding} title="Adicionar bloco" onClose={() => setAdding(false)}>
        {KINDS.map(k => (
          <Pressable key={k} accessibilityRole="button" onPress={() => addBlock(k)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: C.line }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: blockColor(k, C.dark) }} />
            <Txt f="title" size={20} caps style={{ flex: 1 }}>{BLOCK_NAME[k]}</Txt>
            <Txt f="numMed" size={16} color={C.muted}>{fmtClock(blockSeconds(newBlock(k)))}</Txt>
          </Pressable>
        ))}
      </Sheet>

      <Sheet open={!!editing} title={eb ? BLOCK_NAME[eb.kind] : ''} onClose={() => setEditing(null)}
        actions={<SheetActions onCancel={() => setEditing(null)} onOk={saveEditing} okLabel="Guardar" />}>
        {editing && eb && <>
          {(eb.kind === 'aquecimento' || eb.kind === 'calma') && <>
            <Stepper label="Duração" value={fmtClock(eb.dur)} onMinus={() => setEditing({ ...editing, block: { ...eb, dur: Math.max(60, eb.dur - 60) } })}
              onPlus={() => setEditing({ ...editing, block: { ...eb, dur: Math.min(3600, eb.dur + 60) } })} />
            <View style={{ gap: 6 }}>
              <Label size={13}>O que fazer</Label>
              <TextInput value={eb.note} onChangeText={note => setEditing({ ...editing, block: { ...eb, note } })} maxLength={80}
                placeholder={eb.kind === 'aquecimento' ? 'Ex.: corrida, fuga de quadril, rolamentos' : 'Ex.: alongamento e respiração'} placeholderTextColor={C.muted} style={input(C)} />
            </View>
          </>}
          {eb.kind === 'drills' && <>
            {eb.items.map((x, i) => {
              const setItem = (it: DrillItem) => setEditing({ ...editing, block: { ...eb, items: eb.items.map((y, j) => (j === i ? it : y)) } });
              return (
                <View key={i} style={{ gap: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput value={x.name} onChangeText={name => setItem({ ...x, name })} maxLength={40} placeholder="Ex.: Passagem toreando" placeholderTextColor={C.muted}
                      accessibilityLabel={`Drill ${i + 1}`} style={[input(C), { flex: 1 }]} />
                    {eb.items.length > 1 && (
                      <IconButton label={`Remover drill ${i + 1}`} onPress={() => setEditing({ ...editing, block: { ...eb, items: eb.items.filter((_, j) => j !== i) } })}>
                        <Txt f="semi" size={18} color={C.rest}>✕</Txt>
                      </IconButton>
                    )}
                  </View>
                  <Stepper label="Repetições" value={String(x.reps)} onMinus={() => setItem({ ...x, reps: Math.max(1, x.reps - 1) })} onPlus={() => setItem({ ...x, reps: Math.min(10, x.reps + 1) })} />
                  <Stepper label="Tempo de cada" color={C.work} value={fmtClock(x.dur)} onMinus={() => setItem({ ...x, dur: Math.max(15, x.dur - 15) })} onPlus={() => setItem({ ...x, dur: Math.min(1200, x.dur + 15) })} />
                </View>
              );
            })}
            {eb.items.length < 12 && (
              <Pressable accessibilityRole="button" onPress={() => setEditing({ ...editing, block: { ...eb, items: [...eb.items, { name: '', reps: 2, dur: eb.items[0]?.dur ?? 180 }] } })}
                style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line2, alignItems: 'center' }}>
                <Txt f="semi" size={16} color={b.accent} caps track={0.1}>+ Adicionar drill</Txt>
              </Pressable>
            )}
            <Stepper label="Troca entre repetições" color={C.rest} value={fmtClock(eb.rest)} onMinus={() => setEditing({ ...editing, block: { ...eb, rest: Math.max(0, eb.rest - 5) } })}
              onPlus={() => setEditing({ ...editing, block: { ...eb, rest: Math.min(300, eb.rest + 5) } })} />
          </>}
          {(eb.kind === 'posicao' || eb.kind === 'combates') && <>
            <Stepper label={eb.kind === 'posicao' ? 'Voltas' : 'Combates'} value={String(eb.rounds)} onMinus={() => setEditing({ ...editing, block: { ...eb, rounds: Math.max(1, eb.rounds - 1) } })}
              onPlus={() => setEditing({ ...editing, block: { ...eb, rounds: Math.min(30, eb.rounds + 1) } })} />
            <Stepper label={eb.kind === 'posicao' ? 'Tempo de cada volta' : 'Tempo de cada combate'} color={C.work} value={fmtClock(eb.work)}
              onMinus={() => setEditing({ ...editing, block: { ...eb, work: Math.max(30, eb.work - 30) } })} onPlus={() => setEditing({ ...editing, block: { ...eb, work: Math.min(1800, eb.work + 30) } })} />
            <Stepper label="Descanso" color={C.rest} value={fmtClock(eb.rest)} onMinus={() => setEditing({ ...editing, block: { ...eb, rest: Math.max(0, eb.rest - 15) } })}
              onPlus={() => setEditing({ ...editing, block: { ...eb, rest: Math.min(600, eb.rest + 15) } })} />
            {eb.kind === 'posicao' && <Txt f="reg" size={15} color={C.muted}>As posições você escolhe tocando na lista do bloco.</Txt>}
          </>}
          {editing.index < draft.blocks.length && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['↑ Subir', () => moveBlock(-1)], ['↓ Descer', () => moveBlock(1)], ['Remover', removeBlock]] as const).map(([t, fn]) => (
                <Pressable key={t} accessibilityRole="button" onPress={fn} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.line, alignItems: 'center' }}>
                  <Txt f="semi" size={16} color={t === 'Remover' ? C.rest : C.fg} caps track={0.06}>{t}</Txt>
                </Pressable>
              ))}
            </View>
          )}
        </>}
      </Sheet>

      <Sheet open={!!day} title="Dia do treino" onClose={() => setDay(null)} actions={<SheetActions onCancel={() => setDay(null)} onOk={saveDay} okLabel="Guardar" />}>
        {day && <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DAYS.map(([d, t]) => {
              const on = day.weekday === d;
              return (
                <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setDay({ ...day, weekday: d })}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? b.accent : C.line, minWidth: 56, alignItems: 'center' }}>
                  <Txt f="semi" size={17} color={on ? b.ink : C.fg} caps track={0.06}>{t}</Txt>
                </Pressable>
              );
            })}
          </View>
          {day.weekday !== null && <>
            <Stepper label="Horário" value={clockTime(day.time)} onMinus={() => setDay({ ...day, time: (day.time + 1440 - 15) % 1440 })} onPlus={() => setDay({ ...day, time: (day.time + 15) % 1440 })} />
            <View style={{ flexDirection: 'row', gap: 6, backgroundColor: C.ground, borderRadius: 12, padding: 4 }}>
              {([[true, 'Toda semana'], [false, 'Só uma vez']] as const).map(([w, t]) => (
                <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: day.weekly === w }} onPress={() => setDay({ ...day, weekly: w })}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: day.weekly === w ? C.panel : 'transparent' }}>
                  <Txt f="semi" size={17} color={day.weekly === w ? C.fg : C.muted} caps track={0.06}>{t}</Txt>
                </Pressable>
              ))}
            </View>
          </>}
        </>}
      </Sheet>

      <Sheet open={!!times} title="Tempos do plano" onClose={() => setTimes(null)}
        actions={<SheetActions onCancel={() => setTimes(null)} onOk={() => { if (times) setDraft({ ...draft, ...times }); setTimes(null); }} okLabel="Guardar" />}>
        {times && <>
          <Stepper label="Preparar (antes do 1º bloco)" color={C.prep} value={fmtClock(times.prep)} onMinus={() => setTimes({ ...times, prep: Math.max(0, times.prep - 5) })} onPlus={() => setTimes({ ...times, prep: clamp(times.prep + 5, 0, 120) })} />
          <Stepper label="Troca entre blocos" color={C.cycle} value={fmtClock(times.change)} onMinus={() => setTimes({ ...times, change: Math.max(0, times.change - 15) })} onPlus={() => setTimes({ ...times, change: clamp(times.change + 15, 0, 600) })} />
        </>}
      </Sheet>

      {sharing && <ShareSheet plan={sharing} onClose={() => setSharing(null)} />}

      {picking !== null && draft.blocks[picking]?.kind === 'posicao' && (() => {
        const pb = draft.blocks[picking] as Extract<Block, { kind: 'posicao' }>;
        return (
          <PositionsSheet themes={pb.themes} order={pb.order} custom={st.positions} accent={b.accent} ink={b.ink} onClose={() => setPicking(null)}
            onSave={(themes, order) => { setBlock(picking, { ...pb, themes, order }); setPicking(null); }}
            onCustom={positions => st.set({ positions })} />
        );
      })()}
    </Screen>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  const C = useC();
  return (
    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.panel, gap: 2 }}>
      <Txt f="med" size={13} color={C.muted} caps track={0.1}>{label}</Txt>
      <Txt f="semi" size={18} caps numberOfLines={1}>{value}</Txt>
    </View>
  );
}

function Fact({ value, label, C }: { value: string; label: string; C: Palette }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
      <Txt f="numMed" size={20}>{value}</Txt>
      <Txt f="med" size={13} color={C.muted} caps track={0.1}>{label}</Txt>
    </View>
  );
}

function BlockCard({ index, block, C, onEdit, onPositions, onAddDrill }: { index: number; block: Block; C: Palette; onEdit: () => void; onPositions: () => void; onAddDrill: () => void }) {
  const color = blockColor(block.kind, C.dark);
  let body: ReactNode = null;
  if (block.kind === 'aquecimento' || block.kind === 'calma') {
    body = <Txt f="med" size={16} color={block.note ? C.soft : C.muted}>{block.note || 'Toque para dizer o que fazer'}</Txt>;
  } else if (block.kind === 'drills') {
    body = <>
      {block.items.map((x, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
          <Txt f="semi" size={18} caps style={{ flex: 1 }} numberOfLines={1}>{x.name}</Txt>
          <Txt f="numMed" size={16} color={C.muted}>{`${x.reps} × ${fmtClock(x.dur)}`}</Txt>
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={onAddDrill} hitSlop={6} style={{ paddingTop: 6 }}>
        <Txt f="semi" size={15} color={color} caps track={0.1}>+ Adicionar drill</Txt>
      </Pressable>
    </>;
  } else {
    const pos = block.kind === 'posicao';
    body = <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 4 }}>
        <Fact value={`${block.rounds} × ${fmtClock(block.work)}`} label={pos ? 'Voltas' : 'Combates'} C={C} />
        <Fact value={fmtClock(block.rest)} label="Descanso" C={C} />
        {pos && <Fact value={block.order === 'rand' ? 'Sortear' : 'Em ordem'} label="Ordem" C={C} />}
      </View>
      {pos && (
        <Pressable accessibilityRole="button" accessibilityLabel="Escolher posições" onPress={onPositions}
          style={{ marginTop: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt f="med" size={16} color={block.themes.length ? C.soft : C.muted} style={{ flex: 1 }}>{block.themes.length ? block.themes.join(', ') : 'Sem posições: só o tempo'}</Txt>
          <Txt f="semi" size={14} color={color} caps track={0.1}>Posições ›</Txt>
        </Pressable>
      )}
    </>;
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${BLOCK_NAME[block.kind]}`} onPress={onEdit}
      style={{ borderRadius: 16, backgroundColor: C.panel, padding: 14, paddingLeft: 16, gap: 8, borderLeftWidth: 4, borderLeftColor: color }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Txt f="num" size={15} color={C.dark ? '#111315' : '#ffffff'}>{String(index + 1)}</Txt>
        </View>
        <Txt f="title" size={22} caps style={{ flex: 1 }} numberOfLines={1}>{BLOCK_NAME[block.kind]}</Txt>
        <Txt f="numMed" size={18} color={C.muted}>{fmtClock(blockSeconds(block))}</Txt>
        <IconHandle color={C.muted} />
      </View>
      {body}
    </Pressable>
  );
}
