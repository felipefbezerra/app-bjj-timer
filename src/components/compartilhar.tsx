import { useState, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { decodePlan, encodePlan, fileName, findCode, planFile, planLink, type Shared } from '@/lib/compartilhar';
import { pickPlanFile, shareFile, shareLink, sharePdf } from '@/lib/exportar';
import { blockChip, blockColor, blockDetail, blockSeconds, BLOCK_NAME, hmParts, planSeconds, planStats, repeatLabel, whenLabel, type From, type Plan } from '@/lib/plano';
import { planHtml } from '@/lib/planoPdf';
import { useStore } from '@/lib/store';
import { fmtClock } from '@/lib/sequence';
import { beltLook, BELTS, F, useC } from '@/lib/theme';
import { Belt } from './belt';
import { PlanBar } from './plano';
import { Sheet } from './sheet';
import { Label, Panel, PrimaryButton, Txt } from './ui';
import { IconCheck } from './icons';

const IconLink = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Svg>
);
const IconDoc = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Path d="M6 3h8l4 4v14H6z" /><Path d="M14 3v4h4M9 12h6M9 16h6" />
  </Svg>
);
export const IconFolder = ({ color, size = 26 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <Path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><Path d="M12 10v6M9 13l3 3 3-3" />
  </Svg>
);

// Quem manda: o perfil de quem está compartilhando; sem nome no perfil, segue o autor original.
export function useFrom(plan: Plan): From | undefined {
  const { profile } = useStore();
  return profile.name.trim() ? { name: profile.name.trim(), belt: profile.belt } : plan.from;
}

export function ShareSheet({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const C = useC();
  const st = useStore();
  const b = beltLook(st.profile.belt, C);
  const from = useFrom(plan);
  const [msg, setMsg] = useState('');
  const code = encodePlan(plan, from);
  const link = planLink(code);
  const [n, unit] = hmParts(planSeconds(plan));
  const stats = planStats(plan);

  const run = async (what: 'link' | 'pdf' | 'file') => {
    setMsg('');
    try {
      if (what === 'link') {
        const text = `${plan.name} (${n} ${unit}): plano de treino${from ? ` de ${from.name}` : ''}. Toque no link para adicionar no app:\n${link}`;
        const r = await shareLink(text, link);
        if (r === 'copied') setMsg('Link copiado. Cole na conversa para mandar.');
        else if (r === 'shared') onClose();
      } else if (what === 'pdf') {
        await sharePdf(planHtml(plan, link, from), fileName(plan, 'pdf'), plan.name);
      } else {
        await shareFile(planFile(plan, from), fileName(plan, 'json'), plan.name);
      }
    } catch {
      setMsg(what === 'pdf' ? 'Não deu para gerar o PDF. Tente de novo.' : 'Não deu para compartilhar. Tente de novo.');
    }
  };

  const option = (icon: ReactNode, bg: string, title: string, line: string, onPress: () => void, tag?: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.dark ? '#24282c' : 'rgba(255,255,255,.9)', opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Txt f="title" size={20} caps>{title}</Txt>
          {tag && <View style={{ paddingVertical: 1, paddingHorizontal: 8, borderRadius: 999, backgroundColor: C.dark ? 'rgba(143,224,74,.16)' : 'rgba(47,122,14,.12)' }}><Txt f="semi" size={12} color={C.work} caps track={0.1}>{tag}</Txt></View>}
        </View>
        <Txt f="med" size={15} color={C.soft}>{line}</Txt>
      </View>
      <Txt size={24} color={C.muted}>›</Txt>
    </Pressable>
  );

  return (
    <Sheet open title="Compartilhar plano" onClose={onClose} actions={<PrimaryButton label="Fechar" height={52} light={false} onPress={onClose} />}>
      <Txt f="med" size={16} color={C.soft}>Para outro professor dar a aula no seu lugar.</Txt>
      <View style={{ gap: 8, padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.ground }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <Txt f="title" size={20} caps numberOfLines={1} style={{ flex: 1 }}>{plan.name}</Txt>
          <Txt f="numMed" size={20}>{`${n} ${unit}`}</Txt>
        </View>
        <PlanBar plan={plan} height={8} />
        <Txt f="med" size={14} color={C.muted}>{[`${plan.blocks.length} ${plan.blocks.length === 1 ? 'bloco' : 'blocos'}`, stats.drills ? `${stats.drills} drills` : '', stats.fights ? `${stats.fights} combates` : ''].filter(Boolean).join(' · ') || plan.blocks.map(blockChip).join(' · ')}</Txt>
      </View>
      <View style={{ gap: 8 }}>
        {option(<IconLink color={b.ink} />, b.accent, 'Link para importar', 'Quem recebe toca no link, o app abre e o plano entra nos planos dele.', () => run('link'), 'Recomendado')}
        {option(<IconDoc color="#111315" />, '#f3f1ea', 'PDF para imprimir', 'Folha com blocos, tempos, drills e posições. Abre sem o app.', () => run('pdf'))}
        {option(<IconFolder color="#111315" />, '#b8bcc2', 'Arquivo do plano', 'Para mandar por e-mail ou guardar. Importa no app.', () => run('file'))}
      </View>
      {!!msg && <Txt f="semi" size={16} color={msg.startsWith('Link') ? C.work : C.rest}>{msg}</Txt>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.line2 }}>
        {from && <Belt belt={from.belt} height={10} width={56} small />}
        <Txt f="med" size={15} color={C.soft} style={{ flex: 1 }}>
          {!from ? 'Vai sem nome. Para mandar com o seu, preencha o perfil na aba Treinos.'
            : `${st.profile.name.trim() ? 'Vai com seu nome' : 'Vai com o nome de quem montou'}: ${from.name} · faixa ${BELTS[from.belt].name.toLowerCase()}`}
        </Txt>
      </View>
    </Sheet>
  );
}

// Plano que chegou de outra pessoa, pronto para guardar nos planos.
export function asNewPlan(sh: Shared): Plan {
  const now = Date.now();
  return { ...sh.plan, id: now.toString(36), updated: now, from: sh.from };
}

export function sharedSummary(sh: Shared) {
  const st = planStats({ ...sh.plan, id: '', updated: 0 });
  return [sh.from ? `De ${sh.from.name}` : '', `${sh.plan.blocks.length} ${sh.plan.blocks.length === 1 ? 'bloco' : 'blocos'}`,
    st.drills ? `${st.drills} drills` : '', st.fights ? `${st.fights} combates` : ''].filter(Boolean).join(' · ');
}

// O plano inteiro, como aparece para quem recebe: blocos com o que tem dentro e o tempo de cada um.
export function PlanPreview({ plan }: { plan: Plan }) {
  const C = useC();
  const [n, unit] = hmParts(planSeconds(plan));
  return (
    <Panel stitch style={{ borderRadius: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt f="title" size={26} caps>{plan.name}</Txt>
          <Txt f="med" size={14} color={C.muted} caps track={0.1}>{`${whenLabel(plan)}${plan.weekday !== null && plan.weekly ? ` · ${repeatLabel(plan).toLowerCase()}` : ''}`}</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Txt f="num" size={30}>{n}</Txt><Txt f="med" size={14} color={C.muted} caps>{unit}</Txt>
        </View>
      </View>
      <PlanBar plan={plan} height={10} />
      <View>
        {plan.blocks.map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: blockColor(b.kind, C.dark) }} />
            <View style={{ flex: 1, gap: 1 }}>
              <Txt f="semi" size={18} caps>{BLOCK_NAME[b.kind]}</Txt>
              {!!blockDetail(b) && <Txt f="med" size={14} color={C.muted} numberOfLines={2}>{blockDetail(b)}</Txt>}
            </View>
            <Txt f="numMed" size={16} color={C.soft}>{fmtClock(blockSeconds(b))}</Txt>
          </View>
        ))}
      </View>
    </Panel>
  );
}

// Importar pela aba Planejar: colar o link (ou a mensagem inteira) ou abrir o arquivo do plano.
export function ImportSheet({ onClose, onImported }: { onClose: () => void; onImported: (p: Plan) => void }) {
  const C = useC();
  const st = useStore();
  const b = beltLook(st.profile.belt, C);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const code = findCode(text);
  const sh = code ? decodePlan(code) : null;

  const openFile = async () => {
    setErr('');
    try {
      const t = await pickPlanFile();
      if (t === null) return;
      const c = findCode(t);
      if (c && decodePlan(c)) setText(c);
      else setErr('Esse arquivo não é um plano de treino.');
    } catch { setErr('Não deu para abrir o arquivo.'); }
  };
  const doImport = () => {
    if (!sh) return;
    const p = asNewPlan(sh);
    st.savePlan(p);
    onImported(p);
  };

  return (
    <Sheet open title="Importar plano" onClose={onClose} actions={
      <View style={{ gap: 10 }}>
        <Pressable accessibilityRole="button" onPress={openFile}
          style={{ height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.line2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <IconFolder color={C.fg} size={20} />
          <Txt f="semi" size={18} caps track={0.1}>Abrir arquivo do plano</Txt>
        </Pressable>
        <View style={{ opacity: sh ? 1 : 0.4 }} pointerEvents={sh ? 'auto' : 'none'}>
          <PrimaryButton label="Importar" height={56} onPress={doImport} />
        </View>
      </View>
    }>
      <Txt f="med" size={16} color={C.soft}>Cole o link que você recebeu ou abra o arquivo do plano.</Txt>
      <View style={{ gap: 6 }}>
        <Label size={13}>Link do plano</Label>
        <TextInput value={text} onChangeText={t => { setText(t); setErr(''); }} placeholder="Cole aqui o link ou a mensagem" placeholderTextColor={C.muted}
          autoCapitalize="none" autoCorrect={false} multiline numberOfLines={2} accessibilityLabel="Link do plano"
          style={{ fontFamily: F.med, fontSize: 16, color: C.fg, backgroundColor: C.ground, borderRadius: 12, borderWidth: 1, borderColor: sh ? b.accent : C.line, paddingHorizontal: 12, paddingVertical: 10, maxHeight: 84 }} />
      </View>
      {sh && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.dark ? '#24282c' : 'rgba(255,255,255,.9)' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.work, alignItems: 'center', justifyContent: 'center' }}><IconCheck color={C.ink} size={16} /></View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt f="bold" size={19} caps numberOfLines={1}>{`${sh.plan.name} · ${hmParts(planSeconds({ ...sh.plan, id: '', updated: 0 })).join(' ')}`}</Txt>
            <Txt f="med" size={14} color={C.muted}>{sharedSummary(sh)}</Txt>
          </View>
        </View>
      )}
      {!sh && text.trim().length > 0 && !err && <Txt f="semi" size={15} color={C.rest}>Não achei um plano nesse texto. Confira se colou o link inteiro.</Txt>}
      {!!err && <Txt f="semi" size={15} color={C.rest}>{err}</Txt>}
    </Sheet>
  );
}
