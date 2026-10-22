import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Belt } from '@/components/belt';
import { Sheet, SheetActions, Stepper } from '@/components/sheet';
import { Label, Panel, PrimaryButton, Screen, Txt } from '@/components/ui';
import { useStore, type Profile, type SoundMode } from '@/lib/store';
import { BELT_ORDER, BELTS, C, F } from '@/lib/theme';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY = 864e5;

function weekStart(t: number) { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); }
function hm(sec: number) { const m = Math.round(sec / 60); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`; }

export default function Treinos() {
  const st = useStore();
  const b = BELTS[st.profile.belt];
  const [profile, setProfile] = useState<(Profile & { goal: number }) | null>(null);
  const [settings, setSettings] = useState(false);
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const [now] = useState(() => Date.now());
  const ws = weekStart(now);
  const week = useMemo(() => {
    const cur = st.history.filter(h => h.t >= ws);
    const prev = st.history.filter(h => h.t >= ws - 7 * DAY && h.t < ws);
    const days = new Set(cur.map(h => new Date(h.t).getDay()));
    const streak = (() => {
      const weeks = new Set(st.history.map(h => weekStart(h.t)));
      let w = ws, n = 0;
      if (!weeks.has(w)) w -= 7 * DAY;
      while (weeks.has(w)) { n++; w = weekStart(w - 3 * DAY); }
      return n;
    })();
    return { count: cur.length, prev: prev.length, days, work: cur.reduce((a, h) => a + h.work, 0), rounds: cur.reduce((a, h) => a + h.rounds, 0), streak };
  }, [st.history, ws]);

  const monthDays = useMemo(() => {
    const set = new Set(st.history.filter(h => { const d = new Date(h.t); return d.getFullYear() === view.y && d.getMonth() === view.m; }).map(h => new Date(h.t).getDate()));
    const first = new Date(view.y, view.m, 1).getDay(), total = new Date(view.y, view.m + 1, 0).getDate();
    return { set, first, total };
  }, [st.history, view]);

  const today = new Date(now);
  const isThisMonth = view.y === today.getFullYear() && view.m === today.getMonth();
  const goalPct = Math.min(1, week.count / Math.max(1, st.weeklyGoal));
  const diff = week.count - week.prev;
  const recent = [...st.history].reverse().slice(0, 15);

  const soon = () => Alert.alert('Em construção', 'Essa parte entra na próxima etapa do app.');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 18, gap: 14 }}>
        <Panel stitch style={{ gap: 14, borderRadius: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 2, flex: 1 }}>
              <Txt f="bold" size={32} caps numberOfLines={1}>{st.profile.name || 'Seu nome'}</Txt>
              <Label size={15}>Faixa {b.name.toLowerCase()} · {st.profile.degrees ? `${st.profile.degrees} ${st.profile.degrees === 1 ? 'grau' : 'graus'}` : 'lisa'}</Label>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setProfile({ ...st.profile, goal: st.weeklyGoal })}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.line2 }}>
              <Txt f="med" size={14} caps track={0.1}>Editar perfil</Txt>
            </Pressable>
          </View>
          <Belt belt={st.profile.belt} degrees={st.profile.degrees} height={30} />
        </Panel>

        <Panel style={{ gap: 14, borderRadius: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Txt f="bold" size={22} caps>Esta semana</Txt>
            <Label>{new Date(ws).getDate()} a {new Date(ws + 6 * DAY).getDate()} {MONTHS[new Date(ws + 6 * DAY).getMonth()].slice(0, 3).toLowerCase()}</Label>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Txt f="num" size={52} style={{ lineHeight: 58 }}>{String(week.count)}</Txt>
            <Txt f="med" size={20} color={C.muted} caps>de {st.weeklyGoal} treinos da meta</Txt>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: C.line, overflow: 'hidden' }}>
            <View style={{ width: `${goalPct * 100}%`, height: '100%', backgroundColor: b.accent }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {WD.map((w, i) => {
              const done = week.days.has(i), isToday = i === today.getDay(), future = i > today.getDay();
              return (
                <View key={w} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: done ? b.accent : future ? 'transparent' : C.line,
                    borderWidth: future && !done ? 1 : isToday ? 2 : 0, borderStyle: future && !done ? 'dashed' : 'solid', borderColor: isToday ? C.fg : C.line2 }} />
                  <Txt f={isToday ? 'semi' : 'med'} size={13} color={isToday ? C.fg : C.muted} caps>{w}</Txt>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 }}>
            <View style={{ flex: 1 }}><Txt f="numMed" size={26}>{hm(week.work)}</Txt><Txt f="med" size={12} color={C.muted} caps track={0.1}>No tatame</Txt></View>
            <View style={{ flex: 1 }}><Txt f="numMed" size={26}>{String(week.rounds)}</Txt><Txt f="med" size={12} color={C.muted} caps track={0.1}>Rondas</Txt></View>
            <View style={{ flex: 1 }}><Txt f="numMed" size={26} color={diff > 0 ? C.work : diff < 0 ? C.rest : C.fg}>{diff > 0 ? `+${diff}` : String(diff)}</Txt><Txt f="med" size={12} color={C.muted} caps track={0.1}>Vs. semana passada</Txt></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><PrimaryButton label="Ver relatório" height={50} onPress={soon} /></View>
            <View style={{ flex: 1 }}><PrimaryButton label="+ Registrar" height={50} light={false} onPress={soon} /></View>
          </View>
          {week.streak > 1 && <Txt f="med" size={16} color={C.soft} caps track={0.04}>{week.streak} semanas seguidas no tatame</Txt>}
        </Panel>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <Pressable accessibilityLabel="Mês anterior" onPress={() => setView(v => v.m ? { y: v.y, m: v.m - 1 } : { y: v.y - 1, m: 11 })}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' }}><Txt size={22}>‹</Txt></Pressable>
          <Txt f="bold" size={22} caps>{MONTHS[view.m]} {view.y}</Txt>
          <Pressable accessibilityLabel="Próximo mês" disabled={isThisMonth} onPress={() => setView(v => v.m < 11 ? { y: v.y, m: v.m + 1 } : { y: v.y + 1, m: 0 })}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', opacity: isThisMonth ? 0.35 : 1 }}><Txt size={22}>›</Txt></Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {WD.map(w => <View key={w} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 4 }}><Txt f="numMed" size={13} color={C.muted}>{w[0]}</Txt></View>)}
          {Array.from({ length: monthDays.first }, (_, i) => <View key={`e${i}`} style={{ width: `${100 / 7}%` }} />)}
          {Array.from({ length: monthDays.total }, (_, i) => {
            const d = i + 1, on = monthDays.set.has(d), isT = isThisMonth && d === today.getDate();
            return (
              <View key={d} style={{ width: `${100 / 7}%`, padding: 2.5 }}>
                <View style={{ paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: on ? b.accent : C.panel, borderWidth: isT ? 2 : 0, borderColor: C.fg }}>
                  <Txt f="numMed" size={14} color={on ? b.ink : C.muted}>{String(d)}</Txt>
                </View>
              </View>
            );
          })}
        </View>

        <View>
          <View style={{ paddingVertical: 6 }}><Label>Últimos treinos</Label></View>
          {recent.length === 0 && <Txt f="reg" size={16} color={C.muted}>Os treinos aparecem aqui quando você termina ou para um treino com pelo menos 30 segundos de luta.</Txt>}
          {recent.map(h => {
            const d = new Date(h.t);
            const when = `${WD[d.getDay()]} ${d.getDate()}`;
            const unit = h.mode === 'circuito' ? (h.rounds === 1 ? 'estação' : 'estações') : (h.rounds === 1 ? 'ronda' : 'rondas');
            const del = confirmDel === h.t;
            return (
              <Pressable key={h.t} onLongPress={() => setConfirmDel(h.t)} onPress={() => setConfirmDel(null)} accessibilityHint="Toque e segure para apagar"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
                <View style={{ width: 6, height: 38, borderRadius: 3, backgroundColor: h.mode === 'circuito' ? C.cycle : C.work }} />
                <View style={{ flex: 1 }}>
                  <Txt f="semi" size={20} caps numberOfLines={1}>{h.mode === 'circuito' ? 'Circuito' : 'Combate'} · {h.rounds} {unit}{h.done ? '' : ' · parcial'}</Txt>
                  <Txt f="med" size={14} color={C.muted} caps numberOfLines={1}>{when}{h.themes.length ? ` · ${h.themes.join(', ')}` : ''}</Txt>
                </View>
                {del ? (
                  <Pressable accessibilityRole="button" onPress={() => { st.removeSession(h.t); setConfirmDel(null); }} style={{ backgroundColor: C.rest, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 }}>
                    <Txt f="semi" size={14} caps>Apagar</Txt>
                  </Pressable>
                ) : <Txt f="numMed" size={20}>{Math.max(1, Math.round(h.work / 60))} min</Txt>}
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={() => setSettings(true)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 16, backgroundColor: C.panel }}>
          <View><Txt f="semi" size={20} caps>Ajustes</Txt><Txt f="med" size={14} color={C.muted} caps>Som, voz e meta semanal</Txt></View>
          <Txt size={24} color={C.muted}>›</Txt>
        </Pressable>
        <Txt f="reg" size={13} color={C.muted} style={{ textAlign: 'center' }}>Temporizador BJJ · app em construção</Txt>
      </ScrollView>

      <Sheet open={!!profile} title="Seu perfil" onClose={() => setProfile(null)}
        actions={<SheetActions onCancel={() => setProfile(null)} onOk={() => {
          if (profile) { const { goal, ...p } = profile; st.set({ profile: { ...p, name: p.name.trim() }, weeklyGoal: goal }); }
          setProfile(null);
        }} okLabel="Guardar" />}>
        {profile && <>
          <View style={{ gap: 6 }}>
            <Label size={13}>Nome ou apelido</Label>
            <TextInput value={profile.name} onChangeText={name => setProfile({ ...profile, name })} maxLength={24} placeholder="Como quer ser chamado" placeholderTextColor={C.muted}
              style={{ fontFamily: F.med, fontSize: 20, color: C.fg, backgroundColor: C.ground, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10 }} />
          </View>
          <Label size={13}>Faixa</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BELT_ORDER.map(k => {
              const on = profile.belt === k;
              return (
                <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }}
                  onPress={() => setProfile({ ...profile, belt: k, degrees: Math.min(profile.degrees, BELTS[k].max) })}
                  style={{ width: '18%', alignItems: 'center', gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: on ? BELTS[k].accent : 'transparent' }}>
                  <View style={{ width: '90%', height: 22, borderRadius: 4, backgroundColor: BELTS[k].color, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }} />
                  <Txt f="med" size={12} caps>{BELTS[k].name}</Txt>
                </Pressable>
              );
            })}
          </View>
          <Belt belt={profile.belt} degrees={profile.degrees} height={30} />
          <Stepper label="Graus" value={String(profile.degrees)} onMinus={() => setProfile({ ...profile, degrees: Math.max(0, profile.degrees - 1) })} onPlus={() => setProfile({ ...profile, degrees: Math.min(BELTS[profile.belt].max, profile.degrees + 1) })} />
          <Stepper label="Meta de treinos por semana" value={String(profile.goal)} onMinus={() => setProfile({ ...profile, goal: Math.max(1, profile.goal - 1) })} onPlus={() => setProfile({ ...profile, goal: Math.min(14, profile.goal + 1) })} />
        </>}
      </Sheet>

      <Sheet open={settings} title="Ajustes" onClose={() => setSettings(false)}
        actions={<PrimaryButton label="Pronto" height={52} onPress={() => setSettings(false)} />}>
        <Label size={13}>Som durante o treino</Label>
        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: C.ground, borderRadius: 12, padding: 4 }}>
          {([['voice', 'Voz'], ['beep', 'Só bipes'], ['mute', 'Mudo']] as [SoundMode, string][]).map(([k, t]) => (
            <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: st.sound === k }} onPress={() => st.set({ sound: k })}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: st.sound === k ? C.line2 : 'transparent' }}>
              <Txt f="semi" size={16} color={st.sound === k ? C.fg : C.muted} caps>{t}</Txt>
            </Pressable>
          ))}
        </View>
        <Txt f="reg" size={14} color={C.muted}>A voz e os bipes tocam por cima da música de outros apps, como Spotify e YouTube, sem pausá-la.</Txt>
      </Sheet>
    </Screen>
  );
}
