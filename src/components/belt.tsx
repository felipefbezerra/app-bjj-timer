import { View } from 'react-native';

import { BELTS, type BeltKey } from '@/lib/theme';

const STRIPE = '#f3f1ea';

// A faixa do app. Sem "fill" é a faixa cheia com os graus na ponteira.
// Com "fill" (0 a 1) ela vira barra de progresso: a cor vai preenchendo e a ponteira mostra
// uma listra por ronda (feitas em branco, a atual na cor da fase, as próximas apagadas).
export function Belt({ belt, degrees = 0, height = 30, width, fill, rounds, roundsDone = 0, current, small }: {
  belt: BeltKey; degrees?: number; height?: number; width?: number | `${number}%`;
  fill?: number; rounds?: number; roundsDone?: number; current?: string; small?: boolean;
}) {
  const b = BELTS[belt];
  const progress = fill !== undefined;
  const count = progress ? Math.min(rounds ?? 0, 8) : degrees;
  const stripeW = small ? 3 : Math.max(5, Math.round(height / 6));
  const stripes = Array.from({ length: count }, (_, i) => {
    if (!progress) return STRIPE;
    if (i < roundsDone) return STRIPE;
    if (i === roundsDone && current) return current;
    return 'rgba(243,241,234,.18)';
  });
  const tipW = small ? 26 : Math.max(70, count * (stripeW + 7) + 18);
  return (
    <View style={{ height, width: width ?? '100%', borderRadius: small ? 3 : 6, overflow: 'hidden',
      backgroundColor: progress ? 'rgba(243,241,234,.08)' : b.color, borderWidth: progress ? 1 : 0, borderColor: 'rgba(243,241,234,.18)' }}>
      {progress && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(1, fill!)) * 100}%`, backgroundColor: b.color }} />}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(3, height * 0.13), backgroundColor: 'rgba(0,0,0,.22)' }} />
      <View style={{ position: 'absolute', right: small ? 8 : height * 0.6, top: 0, bottom: 0, width: tipW, backgroundColor: b.tip,
        flexDirection: 'row', justifyContent: progress ? 'center' : 'flex-end', gap: small ? 3 : 7, paddingHorizontal: small ? 3 : 9 }}>
        {stripes.map((c, i) => <View key={i} style={{ width: stripeW, backgroundColor: c }} />)}
      </View>
    </View>
  );
}
