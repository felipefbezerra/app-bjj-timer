import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconCircuito, IconCombate, IconCronometro, IconTreinos } from '@/components/icons';
import { Txt } from '@/components/ui';
import { C } from '@/lib/theme';

const TABS = {
  index: { label: 'Combate', Icon: IconCombate },
  circuito: { label: 'Circuito', Icon: IconCircuito },
  cronometro: { label: 'Cronômetro', Icon: IconCronometro },
  treinos: { label: 'Treinos', Icon: IconTreinos },
} as const;

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', paddingTop: 10, paddingBottom: Math.max(14, insets.bottom), paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: 'rgba(17,19,21,.96)' }}>
      {state.routes.map((route, i) => {
        const t = TABS[route.name as keyof typeof TABS];
        if (!t) return null;
        const on = state.index === i;
        const color = on ? C.fg : C.muted;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { if (!on) navigateToTab(route.key); }}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <t.Icon color={color} />
            <Txt f={on ? 'semi' : 'med'} size={13} color={color} caps track={0.08}>{t.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.ground } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="circuito" />
      <Tabs.Screen name="cronometro" />
      <Tabs.Screen name="treinos" />
    </Tabs>
  );
}
