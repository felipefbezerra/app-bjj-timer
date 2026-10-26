// Cada peso importado pelo próprio caminho: importar do pacote inteiro põe todos os pesos no app.
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { BarlowCondensed_400Regular } from '@expo-google-fonts/barlow-condensed/400Regular';
import { BarlowCondensed_500Medium } from '@expo-google-fonts/barlow-condensed/500Medium';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { Oswald_500Medium } from '@expo-google-fonts/oswald/500Medium';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { RunStore, setPendingRun } from '@/lib/runner';
import { StoreProvider, useStore } from '@/lib/store';
import { DARK, LIGHT, ThemeCtx } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready, theme } = useStore();
  const system = useColorScheme();
  const C = (theme === 'auto' ? system === 'light' : theme === 'light') ? LIGHT : DARK;
  const [fonts, fontError] = useFonts({
    BarlowCondensed_400Regular, BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, Anton_400Regular,
    Oswald_500Medium, Oswald_600SemiBold,
  });
  // Se uma fonte não chegar (internet fraca), o app abre mesmo assim com a fonte do sistema, em vez de ficar na tela escura.
  const ok = ready && (fonts || !!fontError);

  useEffect(() => {
    if (!ok) return;
    SplashScreen.hideAsync();
    // Se o sistema fechou o app no meio de um treino, ele volta direto para a luta, no ponto certo.
    RunStore.load().then(r => { if (r) { setPendingRun(r); router.push('/treino'); } });
  }, [ok]);

  if (!ok) return null;
  return (
    <ThemeCtx.Provider value={C}>
      <StatusBar style={C.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="plano" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="receber" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="treino" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade', contentStyle: { backgroundColor: DARK.ground } }} />
      </Stack>
    </ThemeCtx.Provider>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <Gate />
    </StoreProvider>
  );
}
