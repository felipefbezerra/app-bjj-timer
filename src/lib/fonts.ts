// Cada peso importado pelo próprio caminho: importar do pacote inteiro põe todos os pesos no app.
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { BarlowCondensed_400Regular } from '@expo-google-fonts/barlow-condensed/400Regular';
import { BarlowCondensed_500Medium } from '@expo-google-fonts/barlow-condensed/500Medium';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { Oswald_500Medium } from '@expo-google-fonts/oswald/500Medium';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { useFonts } from 'expo-font';

// Android e iPhone: os .ttf dos pacotes. A versão web fica em fonts.web.ts.
export function useAppFonts() {
  return useFonts({
    BarlowCondensed_400Regular, BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, Anton_400Regular,
    Oswald_500Medium, Oswald_600SemiBold,
  });
}
