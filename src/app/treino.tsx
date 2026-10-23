import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Belt } from '@/components/belt';
import { IconClose, IconNext, IconPip, IconPrev, IconShare } from '@/components/icons';
import { Fabric, IconButton, Label, Panel, PrimaryButton, Txt } from '@/components/ui';
import { Background, type BgInfo } from '@/lib/background';
import { Janela, type JanelaInfo } from '@/lib/janela';
import { jump, phaseSpeech, RunStore, step, clearPendingRun, peekPendingRun, togglePause, type Run, type RunEvent } from '@/lib/runner';
import { fmtClock, phaseName, type PhaseType } from '@/lib/sequence';
import { Sound } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { DARK as C, ThemeCtx, type TextureKey } from '@/lib/theme';

const LOOK: Record<PhaseType, { color: string; tone: TextureKey; soft: string }> = {
  prep: { color: C.prep, tone: 'amarelo', soft: '#c9c3a6' },
  work: { color: C.work, tone: 'verde', soft: '#b9c2b0' },
  rest: { color: C.rest, tone: 'vermelho', soft: '#c9b5b1' },
  cycle: { color: C.cycle, tone: 'amarelo', soft: '#c9c3a6' },
  relax: { color: C.relax, tone: 'azul', soft: '#aebdcc' },
};

// O que aparece na notificação do Android enquanto o treino roda fora da tela.
function bgInfo(r: Run): BgInfo {
  const s = r.seq[r.i], nx = r.seq[r.i + 1];
  const works = r.seq.filter(x => x.type === 'work').length;
  const counter = s.round ? (r.mode === 'circuito' ? `Estação ${s.round} · Volta ${s.cycle}` : `Ronda ${s.round} de ${works}`) : r.label;
  const theme = s.type === 'work' ? s.theme : nx?.theme ? `Próxima: ${nx.theme}` : undefined;
  const total = r.seq.reduce((a, x) => a + x.dur, 0);
  const left = Math.max(0, r.remaining) + r.seq.slice(r.i + 1).reduce((a, x) => a + x.dur, 0);
  return {
    title: `${phaseName(r.mode, s)} · ${fmtClock(r.remaining)}${r.paused ? ' · pausado' : ''}`,
    desc: [counter, theme].filter(Boolean).join(' · '),
    progress: total ? 1 - left / total : 0,
  };
}

// Na janelinha: só o tempo e a posição (ou o nome da fase quando o treino não tem posições).
function janelaInfo(r: Run): JanelaInfo {
  const s = r.seq[r.i], nx = r.seq[r.i + 1];
  const theme = s.type === 'work' ? s.theme : nx?.theme;
  return { time: fmtClock(r.remaining), label: theme ?? phaseName(r.mode, s), color: LOOK[s.type].color };
}

// A tela do treino é sempre escura, com o tecido na cor da fase, mesmo no tema claro.
export default function TreinoScreen() {
  return (
    <ThemeCtx.Provider value={C}>
      <StatusBar style="light" />
      <Treino />
    </ThemeCtx.Provider>
  );
}

function Treino() {
  const st = useStore();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [pipOk] = useState(() => Janela.isSupported());
  const [inPip, setInPip] = useState(() => Janela.isActive());
  useEffect(() => Janela.onChange(setInPip), []);
  // O motor mexe no treino guardado em runRef; a tela desenha uma cópia (view) a cada passo.
  const [run0] = useState(() => peekPendingRun());
  const runRef = useRef<Run | null>(run0);
  const [view, setView] = useState<Run | null>(() => (run0 ? { ...run0 } : null));
  const sync = useCallback(() => { const cur = runRef.current; if (cur) setView({ ...cur }); }, []);
  const savedRef = useRef(false);
  const soundRef = useRef(st.sound);
  useEffect(() => { soundRef.current = st.sound; }, [st.sound]);

  const saveHistory = useCallback((r: Run) => {
    if (savedRef.current || r.work < 30) return false;
    savedRef.current = true;
    st.addSession({ t: r.startedAt, mode: r.mode, work: Math.round(r.work), rounds: r.rounds, themes: r.done, done: r.finished, label: r.label });
    return true;
  }, [st]);

  const handle = useCallback((r: Run, evs: RunEvent[]) => {
    const mode = soundRef.current;
    for (const e of evs) {
      if (e.kind === 'tick') Sound.cue('tick', mode);
      else if (e.kind === 'warn') Sound.say(e.text, mode);
      else if (e.kind === 'phase') {
        if (e.sound) {
          const t = r.seq[r.i].type;
          Sound.cue(t === 'work' ? 'work' : t === 'rest' || t === 'cycle' ? 'rest' : 'other', mode);
          Sound.say(phaseSpeech(r), mode);
          Haptics.notificationAsync(t === 'work' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }
        RunStore.save(r);
      } else if (e.kind === 'finish') {
        Sound.cue('done', mode);
        Sound.say('Treino concluído. Oss!', mode);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        saveHistory(r);
        RunStore.save(null);
        deactivateKeepAwake();
        Background.stop();
        Janela.setAuto(false);
        Janela.update({ time: 'Oss!', label: 'Treino concluído', color: C.fg });
      }
    }
  }, [saveHistory]);

  useEffect(() => {
    const r = runRef.current;
    if (!r) { router.back(); return; }
    clearPendingRun(r);
    activateKeepAwakeAsync().catch(() => {});
    Sound.start().then(() => { if (r.i === 0 && !r.paused && r.seq[0].dur - r.remaining < 1) Sound.say(phaseSpeech(r), soundRef.current); });
    // Android: serviço com notificação para seguir contando e falando com outro app aberto,
    // e a janelinha flutuante quando você sai do app.
    Background.start(bgInfo(r));
    Janela.setAuto(true);
    RunStore.save(r);
    let lastSave = Date.now();
    const id = setInterval(() => {
      handle(r, step(r));
      if (Date.now() - lastSave > 5000) { RunStore.save(r); lastSave = Date.now(); }
      if (!r.finished) { Background.update(bgInfo(r)); Janela.update(janelaInfo(r)); }
      sync();
    }, 250);
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') { handle(r, step(r)); sync(); }
      else RunStore.save(r);
    });
    return () => { clearInterval(id); sub.remove(); deactivateKeepAwake(); Sound.stop(); Background.stop(); Janela.setAuto(false); Janela.close(); };
  }, [handle, sync]);

  const act = (fn: (cur: Run) => RunEvent[] | void) => {
    const cur = runRef.current;
    if (!cur) return;
    const ev = fn(cur);
    if (ev) handle(cur, ev);
    RunStore.save(cur);
    if (!cur.finished) { Background.update(bgInfo(cur)); Janela.update(janelaInfo(cur)); }
    sync();
  };
  const close = () => {
    const cur = runRef.current;
    if (cur && !cur.finished) saveHistory(cur);
    RunStore.save(null);
    router.back();
  };

  const r = view;
  if (!r) return null;

  const belt = st.profile.belt;
  const workPhases = r.seq.filter(s => s.type === 'work');
  const s = r.seq[r.i];

  // Janelinha flutuante (Android): a tela encolhe e mostra só o tempo e a posição.
  const compact = (Janela.inline && inPip) || (height < 300 && width < 640);
  const landscape = !compact && width > height;

  if (r.finished) {
    if (compact) return <Mini color={C.fg} time="Oss!" label="Treino concluído" />;
    return <Done run={r} onClose={close} landscape={landscape} />;
  }

  const look = LOOK[s.type];
  const name = phaseName(r.mode, s);
  const nx = r.seq[r.i + 1];
  const theme = s.type === 'work' ? s.theme : nx?.theme;
  const left = Math.max(0, r.remaining) + r.seq.slice(r.i + 1).reduce((a, x) => a + x.dur, 0);
  const doneRounds = r.seq.slice(0, r.i).filter(x => x.type === 'work').length;
  const fill = s.type === 'work' ? (doneRounds + (1 - Math.max(0, r.remaining) / s.dur)) / Math.max(1, workPhases.length) : doneRounds / Math.max(1, workPhases.length);
  const counter = s.round ? (r.mode === 'circuito' ? `Estação ${s.round} · Volta ${s.cycle}` : `Ronda ${s.round} de ${workPhases.length}`) : r.label;

  if (compact) return <Mini color={look.color} time={fmtClock(r.remaining)} label={theme ?? name} />;

  const clockSize = landscape ? Math.min(height * 0.42, width * 0.2) : 150;

  const header = (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
      <Txt f="med" size={15} color={look.soft} caps track={0.14} numberOfLines={1} style={{ flex: 1 }}>{r.label}</Txt>
      {pipOk && <IconButton label={inPip ? 'Fechar janelinha' : 'Abrir janelinha'} onPress={() => { Janela.update(janelaInfo(r)); Janela.open(); }}><IconPip color={C.fg} /></IconButton>}
      <IconButton label="Encerrar treino" onPress={close}><IconClose color={C.fg} /></IconButton>
    </View>
  );

  const clock = (
    <Pressable onPress={() => act(togglePause)} accessibilityLabel={r.paused ? 'Continuar' : 'Pausar'}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: landscape ? 6 : 10 }}>
      <View style={{ paddingVertical: 6, paddingHorizontal: 18, borderRadius: 999, backgroundColor: look.color }}>
        <Txt f="bold" size={20} color={C.ink} caps track={0.2}>{name}</Txt>
      </View>
      <Txt f="num" size={clockSize} color={look.color} style={{ lineHeight: clockSize * 1.12, fontVariant: ['tabular-nums'] }} adjustsFontSizeToFit numberOfLines={1}>{fmtClock(r.remaining)}</Txt>
      {theme && (s.type === 'work'
        ? <Txt f="bold" size={landscape ? 28 : 34} caps style={{ textAlign: 'center', lineHeight: landscape ? 30 : 36 }}>{theme}</Txt>
        : <View style={{ alignItems: 'center', gap: landscape ? 4 : 8 }}>
            <Txt f="med" size={16} color={look.soft} caps track={0.14}>Próxima:</Txt>
            <View style={{ paddingVertical: landscape ? 4 : 8, paddingHorizontal: 18, borderWidth: 2, borderColor: 'rgba(243,241,234,.5)', borderRadius: 10 }}>
              <Txt f="bold" size={landscape ? 22 : 26} caps style={{ textAlign: 'center' }}>{theme}</Txt>
            </View>
          </View>)}
      <Txt f="med" size={16} color={look.soft} caps track={0.14}>{counter}</Txt>
      {r.paused && <View style={{ marginTop: 6, borderWidth: 2, borderColor: C.fg, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 2 }}><Txt f="semi" size={18} caps track={0.12}>Pausado</Txt></View>}
    </Pressable>
  );

  const progress = (
    <View style={{ gap: 10, paddingBottom: landscape ? 0 : 18 }}>
      <Belt belt={belt} height={landscape ? 36 : 46} fill={fill} rounds={workPhases.length} roundsDone={doneRounds} current={s.type === 'work' ? look.color : undefined} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Txt f="med" size={14} color={look.soft} caps track={0.12} style={{ flexShrink: 1 }}>{nx ? `A seguir: ${phaseName(r.mode, nx).toLowerCase()} ${fmtClock(nx.dur)}` : 'Último intervalo'}</Txt>
        <Txt f="med" size={14} color={look.soft} caps track={0.12}>Restante {fmtClock(left)}</Txt>
      </View>
    </View>
  );

  const controls = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <IconButton size={landscape ? 56 : 64} label="Voltar" onPress={() => act(cur => jump(cur, -1))}><IconPrev color={C.fg} /></IconButton>
      <View style={{ flex: 1 }}>
        <PrimaryButton label={r.paused ? 'Continuar' : 'Pausar'} height={landscape ? 56 : 64} onPress={() => act(togglePause)} />
      </View>
      <IconButton size={landscape ? 56 : 64} label="Pular" onPress={() => act(cur => jump(cur, 1))}><IconNext color={C.fg} /></IconButton>
    </View>
  );

  const pad = { paddingTop: insets.top + (landscape ? 8 : 12), paddingBottom: Math.max(landscape ? 12 : 24, insets.bottom + 8), paddingLeft: Math.max(20, insets.left + 12), paddingRight: Math.max(20, insets.right + 12) };

  return (
    <Fabric tone={look.tone}>
      <View style={{ height: 6, backgroundColor: look.color }} />
      {landscape ? (
        <View style={{ flex: 1, flexDirection: 'row', gap: 24, ...pad }}>
          <View style={{ flex: 1.15 }}>{clock}</View>
          <View style={{ flex: 1, justifyContent: 'space-between', gap: 14 }}>
            {header}
            {progress}
            {controls}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, ...pad }}>
          {header}
          {clock}
          {progress}
          {controls}
        </View>
      )}
    </Fabric>
  );
}

function Mini({ color, time, label }: { color: string; time: string; label: string }) {
  const { width, height } = useWindowDimensions();
  const size = Math.round(Math.min(height * 0.5, width * 0.3));
  const small = Math.round(Math.max(11, Math.min(height * 0.15, width * 0.08)));
  return (
    <View style={{ flex: 1, backgroundColor: C.ground, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
      <Txt f="num" size={size} color={color} numberOfLines={1} style={{ lineHeight: Math.round(size * 1.15), fontVariant: ['tabular-nums'] }}>{time}</Txt>
      <Txt f="bold" size={small} caps track={0.06} numberOfLines={1} style={{ lineHeight: Math.round(small * 1.2) }}>{label}</Txt>
    </View>
  );
}

function Done({ run, onClose, landscape }: { run: Run; onClose: () => void; landscape: boolean }) {
  const st = useStore();
  const insets = useSafeAreaInsets();
  const d = new Date(run.startedAt);
  const WD = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const weekStart = (() => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x.getTime(); })();
  const inWeek = st.history.filter(h => h.t >= weekStart).length;
  const minutes = Math.max(1, Math.round(run.work / 60));
  const rounds = run.seq.filter(s => s.type === 'work').length;
  const who = st.profile.name ? `Oss, ${st.profile.name}!` : 'Oss!';

  const share = () => Share.share({
    message: `Treino concluído no Temporizador BJJ: ${run.rounds} ${run.mode === 'circuito' ? 'estações' : 'rondas'}, ${minutes} min de ${run.mode === 'circuito' ? 'exercício' : 'luta'}${run.done.length ? ` (${run.done.join(', ')})` : ''}. ${who}`,
  }).catch(() => {});

  const body = (
    <>
        <View style={{ gap: 4 }}>
          <Label size={15}>{WD[d.getDay()]}, {d.getDate()} {MON[d.getMonth()]} · {String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}</Label>
          <Txt f="bold" size={landscape ? 36 : 46} caps style={{ lineHeight: landscape ? 38 : 46 }}>Treino concluído.{'\n'}{who}</Txt>
        </View>

        <Panel stitch style={{ gap: 18, borderRadius: 18, padding: 20 }}>
          <Belt belt={st.profile.belt} height={34} fill={1} rounds={rounds} roundsDone={rounds} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}><Txt f="num" size={40}>{String(run.rounds)}</Txt><Txt f="med" size={13} color={C.muted} caps track={0.12}>{run.mode === 'circuito' ? 'Estações' : 'Rondas'}</Txt></View>
            <View style={{ flex: 1 }}><Txt f="num" size={40}>{String(minutes)}</Txt><Txt f="med" size={13} color={C.muted} caps track={0.12}>{run.mode === 'circuito' ? 'Min de treino' : 'Min de luta'}</Txt></View>
            <View style={{ flex: 1 }}><Txt f="num" size={40}>{String(inWeek)}</Txt><Txt f="med" size={13} color={C.muted} caps track={0.12}>Na semana</Txt></View>
          </View>
          {run.done.length > 0 && (
            <View style={{ gap: 8 }}>
              <Txt f="med" size={13} color={C.muted} caps track={0.12}>{run.mode === 'circuito' ? 'Exercícios' : 'Posições treinadas'}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {run.done.map(t => <View key={t} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: C.line2 }}><Txt f="med" size={16} caps>{t}</Txt></View>)}
              </View>
            </View>
          )}
        </Panel>

        <View style={{ marginTop: landscape ? 0 : 'auto', gap: 10, flexDirection: landscape ? 'row' : 'column' }}>
          <View style={{ flex: landscape ? 1 : undefined }}><PrimaryButton label="Compartilhar" height={60} icon={<IconShare color={C.ink} />} onPress={share} /></View>
          <View style={{ flex: landscape ? 1 : undefined }}><PrimaryButton label="Voltar ao início" height={landscape ? 60 : 56} light={false} onPress={onClose} /></View>
        </View>
    </>
  );

  return (
    <Fabric>
      {landscape
        ? <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: Math.max(20, insets.bottom + 10), paddingLeft: Math.max(20, insets.left + 12), paddingRight: Math.max(20, insets.right + 12), gap: 16 }}>{body}</ScrollView>
        : <View style={{ flex: 1, paddingTop: insets.top + 28, paddingBottom: Math.max(30, insets.bottom + 10), paddingHorizontal: 20, gap: 18 }}>{body}</View>}
    </Fabric>
  );
}
