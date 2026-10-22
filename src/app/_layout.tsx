import { BarlowCondensed_400Regular, BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Oswald_500Medium, Oswald_600SemiBold } from '@expo-google-fonts/oswald';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { RunStore, setPendingRun } from '@/lib/runner';
import { StoreProvider, useStore } from '@/lib/store';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready } = useStore();
  const [fonts] = useFonts({
    BarlowCondensed_400Regular, BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold,
    Oswald_500Medium, Oswald_600SemiBold,
  });
  const ok = ready && fonts;

  useEffect(() => {
    if (!ok) return;
    SplashScreen.hideAsync();
    // Se o sistema fechou o app no meio de um treino, ele volta direto para a luta, no ponto certo.
    RunStore.load().then(r => { if (r) { setPendingRun(r); router.push('/treino'); } });
  }, [ok]);

  if (!ok) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="treino" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Gate />
    </StoreProvider>
  );
}
