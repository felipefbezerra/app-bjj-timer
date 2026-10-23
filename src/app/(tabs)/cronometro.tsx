import { useEffect, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Label, PrimaryButton, Screen, Txt, useShort, useWide } from '@/components/ui';
import { useStore } from '@/lib/store';
import { beltLook, useC } from '@/lib/theme';

function fmt(ms: number) {
  const t = Math.floor(ms / 100);
  const ds = t % 10, s = Math.floor(t / 10) % 60, m = Math.floor(t / 600);
  return { main: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, dec: `.${ds}` };
}


export default function Cronometro() {
  const C = useC();
  const accent = beltLook(useStore().profile.belt, C).accent;
  // Celular deitado: relógio e botões lado a lado. Tablet e computador mantêm a coluna, centralizada.
  const wide = useWide(), short = useShort();
  const side = wide && short;
  const { height } = useWindowDimensions();
  // Hora real: continua certo mesmo se o app ficar em segundo plano.
  const [acc, setAcc] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  const [laps, setLaps] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (start === null) return;
    timer.current = setInterval(() => setNow(Date.now()), 100);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [start]);

  const elapsed = acc + (start !== null ? Math.max(0, now - start) : 0);
  const running = start !== null;
  const t = fmt(elapsed);
  const minuteFrac = (elapsed % 60000) / 60000;

  const toggle = () => {
    if (running) { setAcc(acc + Date.now() - start); setStart(null); }
    else { const t0 = Date.now(); setNow(t0); setStart(t0); }
  };
  const lapOrReset = () => {
    if (running) setLaps([...laps, elapsed]);
    else { setAcc(0); setLaps([]); }
  };

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 2 }}>
      <Label size={15}>Rola livre ou drill</Label>
      <Txt f="bold" size={30} caps track={0.02}>Cronômetro</Txt>
    </View>
  );
  const ring = <Ring size={side ? Math.max(180, Math.min(290, height - 120)) : 290} frac={minuteFrac} color={accent} main={t.main} dec={t.dec}
    label={laps.length ? `Volta ${laps.length + 1}` : running ? 'Valendo' : elapsed ? 'Pausado' : 'Pronto'} />;
  const controls = (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 26 }}>
      <View style={{ flex: 1 }}><PrimaryButton label={running ? 'Volta' : 'Zerar'} light={false} height={60} onPress={lapOrReset} /></View>
      <View style={{ flex: 1 }}><PrimaryButton label={running ? 'Pausar' : elapsed ? 'Continuar' : 'Iniciar'} height={60} onPress={toggle} /></View>
    </View>
  );
  const lapList = (
    <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
      {[...laps].reverse().map((v, idx) => {
        const n = laps.length - idx, prev = n > 1 ? laps[n - 2] : 0, d = fmt(v - prev), tot = fmt(v);
        return (
          <View key={n} style={{ flexDirection: 'row', gap: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <Txt f="med" size={18} color={C.muted} caps style={{ flex: 1 }}>Volta {n}</Txt>
            <Txt f="numMed" size={18} color={C.muted}>+{d.main}{d.dec}</Txt>
            <Txt f="numMed" size={18}>{tot.main}{tot.dec}</Txt>
          </View>
        );
      })}
    </View>
  );

  if (side) return (
    <Screen>
      <View style={{ flex: 1, flexDirection: 'row', width: '100%', maxWidth: 1100, alignSelf: 'center' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}>{ring}</View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>{header}{controls}{lapList}</ScrollView>
      </View>
    </Screen>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {header}
        <View style={{ alignSelf: 'center', marginTop: 26 }}>{ring}</View>
        {controls}
        {lapList}
      </ScrollView>
    </Screen>
  );
}

// Anel que enche a cada minuto, com o tempo no meio. Tudo cresce junto com o tamanho.
function Ring({ size, frac, color, main, dec, label }: { size: number; frac: number; color: string; main: string; dec: string; label: string }) {
  const C = useC();
  const k = size / 290, c = size / 2, r = c - 13 * k, len = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth={10 * k} />
        <Circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={10 * k} strokeLinecap="round"
          strokeDasharray={`${len * frac} ${len}`} transform={`rotate(-90 ${c} ${c})`} />
      </Svg>
      <Txt f="num" size={Math.round(78 * k)} style={{ fontVariant: ['tabular-nums'] }}>
        {main}<Txt f="num" size={Math.round(38 * k)} color={C.muted}>{dec}</Txt>
      </Txt>
      <Label size={k < 0.8 ? 13 : 15}>{label}</Label>
    </View>
  );
}
