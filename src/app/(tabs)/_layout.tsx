import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconCircuito, IconCombate, IconCronometro, IconTreinos } from '@/components/icons';
import { Txt, useShort } from '@/components/ui';
import { useC } from '@/lib/theme';

const TABS = {
  index: { label: 'Combate', Icon: IconCombate },
  circuito: { label: 'Circuito', Icon: IconCircuito },
  cronometro: { label: 'Cronômetro', Icon: IconCronometro },
  treinos: { label: 'Treinos', Icon: IconTreinos },
} as const;

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const C = useC();
  // Celular deitado: barra baixa, com o ícone ao lado do nome, para sobrar altura para a tela.
  const short = useShort();
  // No computador, as abas ficam na mesma largura do conteúdo.
  const side = Math.max(12, (useWindowDimensions().width - 1100) / 2);
  return (
    <View style={{ flexDirection: 'row', paddingTop: short ? 6 : 10, paddingBottom: Math.max(short ? 6 : 14, insets.bottom), paddingLeft: side + insets.left, paddingRight: side + insets.right,
      borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bar }}>
      {state.routes.map((route, i) => {
        const t = TABS[route.name as keyof typeof TABS];
        if (!t) return null;
        const on = state.index === i;
        const color = on ? C.fg : C.muted;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { if (!on) navigateToTab(route.key); }}
            style={{ flex: 1, flexDirection: short ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: short ? 8 : 4, minHeight: short ? 36 : undefined }}>
            <t.Icon color={color} />
            <Txt f={on ? 'semi' : 'med'} size={13} color={color} caps track={0.08}>{t.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const C = useC();
  return (
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.ground } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="circuito" />
      <Tabs.Screen name="cronometro" />
      <Tabs.Screen name="treinos" />
    </Tabs>
  );
}
