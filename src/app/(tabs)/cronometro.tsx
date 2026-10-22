import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Label, PrimaryButton, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';
import { BELTS, C } from '@/lib/theme';

function fmt(ms: number) {
  const t = Math.floor(ms / 100);
  const ds = t % 10, s = Math.floor(t / 10) % 60, m = Math.floor(t / 600);
  return { main: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, dec: `.${ds}` };
}

const R = 132, LEN = 2 * Math.PI * R;

export default function Cronometro() {
  const accent = BELTS[useStore().profile.belt].accent;
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 2 }}>
          <Label size={15}>Rola livre ou drill</Label>
          <Txt f="bold" size={30} caps track={0.02}>Cronômetro</Txt>
        </View>

        <View style={{ width: 290, height: 290, alignSelf: 'center', marginTop: 26, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={290} height={290} viewBox="0 0 290 290" style={{ position: 'absolute' }}>
            <Circle cx={145} cy={145} r={R} fill="none" stroke={C.line} strokeWidth={10} />
            <Circle cx={145} cy={145} r={R} fill="none" stroke={accent} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={`${LEN * minuteFrac} ${LEN}`} transform="rotate(-90 145 145)" />
          </Svg>
          <Txt f="num" size={78} style={{ fontVariant: ['tabular-nums'] }}>
            {t.main}<Txt f="num" size={38} color={C.muted}>{t.dec}</Txt>
          </Txt>
          <Label size={15}>{laps.length ? `Volta ${laps.length + 1}` : running ? 'Valendo' : elapsed ? 'Pausado' : 'Pronto'}</Label>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 26 }}>
          <View style={{ flex: 1 }}><PrimaryButton label={running ? 'Volta' : 'Zerar'} light={false} height={60} onPress={lapOrReset} /></View>
          <View style={{ flex: 1 }}><PrimaryButton label={running ? 'Pausar' : elapsed ? 'Continuar' : 'Iniciar'} height={60} onPress={toggle} /></View>
        </View>

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
      </ScrollView>
    </Screen>
  );
}
