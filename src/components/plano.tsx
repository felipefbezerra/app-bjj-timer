import { router } from 'expo-router';
import { View } from 'react-native';

import { blockColor, blockSeconds, buildPlanSequence, type Plan } from '@/lib/plano';
import { newRun, setPendingRun } from '@/lib/runner';
import { Sound } from '@/lib/sound';
import { useC } from '@/lib/theme';

// Barra com um pedaço por bloco, na cor do bloco e do tamanho do tempo dele.
export function PlanBar({ plan, height = 12 }: { plan: Plan; height?: number }) {
  const C = useC();
  if (!plan.blocks.length) return <View style={{ height, borderRadius: height / 2, backgroundColor: C.line }} />;
  return (
    <View style={{ flexDirection: 'row', gap: 3, height, borderRadius: height / 2, overflow: 'hidden' }}>
      {plan.blocks.map((b, i) => <View key={i} style={{ flex: Math.max(1, blockSeconds(b)), backgroundColor: blockColor(b.kind, C.dark) }} />)}
    </View>
  );
}

export function startPlan(plan: Plan) {
  const seq = buildPlanSequence(plan);
  if (!seq.length) return;
  Sound.prime();
  setPendingRun(newRun('plano', plan.name, seq, plan));
  router.push('/treino');
}
