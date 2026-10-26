import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';

import { Belt } from '@/components/belt';
import { asNewPlan, PlanPreview } from '@/components/compartilhar';
import { IconClose } from '@/components/icons';
import { IconButton, Label, Panel, PrimaryButton, Screen, Split, Txt, useWide } from '@/components/ui';
import { appLink, decodePlan } from '@/lib/compartilhar';
import { useStore } from '@/lib/store';
import { BELTS, useC } from '@/lib/theme';

// Aberta pelo link de um plano compartilhado: mostra o plano e guarda nos planos de quem recebeu.
export default function Receber() {
  const st = useStore();
  const C = useC();
  const wide = useWide();
  const { p } = useLocalSearchParams<{ p?: string }>();
  const [sh] = useState(() => (p ? decodePlan(String(p)) : null));
  // No navegador do Android, com o app instalado, dá para abrir o plano direto nele.
  const [android] = useState(() => Platform.OS === 'web' && typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent));
  const plan = sh ? asNewPlan(sh) : null;

  const leave = () => router.replace('/planejar');
  const add = () => { if (plan) { st.savePlan(plan); leave(); } };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14 }}>
      <IconButton label="Fechar" onPress={leave}><IconClose color={C.fg} /></IconButton>
      <Label size={15}>Plano recebido</Label>
    </View>
  );

  if (!sh || !plan) {
    return (
      <Screen>
        {header}
        <View style={{ padding: 20, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <Panel stitch style={{ borderRadius: 18, gap: 8, padding: 18 }}>
            <Txt f="bold" size={26} caps>Esse plano não abriu</Txt>
            <Txt f="reg" size={17} color={C.soft}>O link pode ter sido cortado na mensagem. Peça para mandarem de novo ou use o arquivo do plano em Planejar › Importar.</Txt>
          </Panel>
          <PrimaryButton label="Ir para Planejar" height={56} onPress={leave} />
        </View>
      </Screen>
    );
  }

  const from = sh.from;
  const left = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
      {from && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' }}>
            <Txt f="bold" size={18}>{from.name.slice(0, 1).toUpperCase()}</Txt>
          </View>
          <View style={{ gap: 3 }}>
            <Txt f="med" size={17} color={C.soft}>{`${from.name} mandou este plano`}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Belt belt={from.belt} height={8} width={44} small />
              <Txt f="med" size={13} color={C.muted} caps track={0.1}>{`Faixa ${BELTS[from.belt].name.toLowerCase()}`}</Txt>
            </View>
          </View>
        </View>
      )}
      <PlanPreview plan={plan} />
    </View>
  );

  const right = (
    <View style={{ paddingHorizontal: 20, paddingLeft: wide ? 0 : 20, paddingTop: wide ? 128 : 12, gap: 10 }}>
      {!!plan.notes.trim() && (
        <Panel style={{ gap: 3, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
          <Label size={12}>Observações</Label>
          <Txt f="med" size={16} color={C.soft}>{plan.notes.trim()}</Txt>
        </Panel>
      )}
      <Txt f="med" size={14} color={C.muted} style={{ textAlign: 'center', paddingTop: 6 }}>Depois de adicionar, dá para mudar o dia e os tempos.</Txt>
      <PrimaryButton label="Adicionar aos meus planos" height={60} onPress={add} />
      {android && p && (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(appLink(String(p)))} style={{ alignItems: 'center', padding: 8 }}>
          <Txt f="semi" size={16} color={C.relax} caps track={0.08}>Tem o app instalado? Abrir nele</Txt>
        </Pressable>
      )}
      <PrimaryButton label="Agora não" height={52} light={false} onPress={leave} />
    </View>
  );

  return (
    <Screen>
      <Split left={<>{header}{left}</>} right={right} />
    </Screen>
  );
}
