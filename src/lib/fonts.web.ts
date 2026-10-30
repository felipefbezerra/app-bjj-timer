import { useEffect, useState } from 'react';

// Versão web: as fontes vêm de public/fonts (woff2 só com os caracteres latinos, gerados por scripts/fonts.sh)
// e são declaradas no public/index.html, que já as baixa junto com a página, sem esperar o código do app.
// Aqui só esperamos que estejam prontas, no máximo 4 s; depois disso o app abre com a fonte do sistema.
const FAMILIES = [
  'BarlowCondensed_400Regular', 'BarlowCondensed_500Medium', 'BarlowCondensed_600SemiBold', 'BarlowCondensed_700Bold',
  'Anton_400Regular', 'Oswald_500Medium', 'Oswald_600SemiBold',
];

export function useAppFonts(): [boolean, Error | null] {
  const [state, setState] = useState<[boolean, Error | null]>([false, null]);
  useEffect(() => {
    let done = false;
    const finish = (s: [boolean, Error | null]) => { if (!done) { done = true; setState(s); } };
    const timer = setTimeout(() => finish([false, new Error('fontes demoraram')]), 4000);
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!fonts) finish([true, null]);
    else Promise.all(FAMILIES.map(f => fonts.load(`16px "${f}"`))).then(() => finish([true, null]), e => finish([false, e]));
    return () => clearTimeout(timer);
  }, []);
  return state;
}
