# BJJ Timer (app)

Versão em app do Temporizador BJJ, feita com React Native (Expo) e o design "Tatame".
Roda em Android e iPhone com o mesmo código. **App em construção**, ainda não publicado nas lojas.

## O que tem

- **Combate**: treinos prontos (Aula, Competição com o tempo da sua faixa, Rola longo, Posição) e "Meu treino" ajustável.
- **Circuito**: estações com nome e tempo, troca, voltas e descanso entre voltas.
- **Cronômetro**: com voltas.
- **Treinos**: perfil (nome, faixa, graus), meta da semana, sequência, calendário do mês e últimos treinos.
- **Treino em andamento**: a cor e o tecido mudam por fase, a faixa enche conforme as rondas, voz em português, bipes e vibração.
- O tempo usa a hora real. Se o sistema congelar o app, ele desconta certo quando volta, e o treino é retomado se o app for fechado.
- Tudo fica salvo no próprio aparelho (AsyncStorage), sem banco de dados.

## Como rodar

```bash
npm install
npx expo start
```

- **No celular:** instale o app **Expo Go** (Play Store ou App Store) e leia o QR code que aparece no terminal. O celular e o computador precisam estar na mesma rede Wi‑Fi.
- **No navegador:** aperte `w` no terminal, ou gere a versão web com `npx expo export -p web` (sai na pasta `dist`).

> O segundo plano (continuar contando e falando com outro app aberto, com música) só funciona de verdade num build do app.
> No Expo Go ele pode se comportar diferente. Para testar isso, gere um build de desenvolvimento com
> `npx expo run:android` / `npx expo run:ios` ou com o EAS Build.

## Estrutura

```
src/app/            telas (expo-router)
  (tabs)/           Combate, Circuito, Cronômetro, Treinos
  treino.tsx        tela do treino em andamento
src/components/     peças de interface (faixa, painéis, ícones, folhas)
src/lib/            regras: sequência de fases, relógio, som/voz, dados salvos, cores
assets/textures/    tecido do tatame em cada cor
assets/sounds/      bipes e o áudio silencioso que mantém o app vivo em segundo plano
```

## Verificações

```bash
npx tsc --noEmit
npx eslint .
```

## Próximos passos

- Ícone e tela de abertura próprios (hoje são os do modelo do Expo).
- Relatório semanal e registro manual de treinos.
- No Android, um serviço em primeiro plano para garantir o áudio em segundo plano junto com outros apps.
