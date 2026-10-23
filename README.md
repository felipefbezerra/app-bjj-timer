# BJJ Timer (app)

Versão em app do Temporizador BJJ, feita com React Native (Expo) e o design "Tatame".
Roda em Android e iPhone com o mesmo código. **App em construção**, ainda não publicado nas lojas.

## O que tem

- **Combate**: treinos prontos (Aula, Competição com o tempo da sua faixa, Rola longo, Posição) e "Meu treino" ajustável.
  Em **Posições** você escolhe da lista ou cria as suas, em ordem ou sorteadas (todas saem antes de repetir).
  A posição da volta aparece grande na tela e é falada no começo.
- **Circuito**: prontos (Condicionamento, Drills de técnica e Circuito curto 30/10) e "Meu circuito", com estações de nome e tempo, troca, voltas e descanso entre voltas.
- **Cronômetro**: com voltas.
- **Treinos**: perfil (nome, faixa, graus), meta da semana, sequência, calendário do mês e últimos treinos.
  Dá para registrar à mão um treino feito sem o app (aula, rola, drill, circuito, competição) e excluir qualquer treino tocando nele.
- **Treino em andamento**: a cor e o tecido mudam por fase, a faixa enche conforme as voltas, voz em português, bipes e vibração.
  Funciona em pé e deitado.
- **Segundo plano**: no Android, um serviço com notificação (fase, tempo e progresso) mantém o treino contando e falando
  com outro app aberto, e a janelinha flutuante abre sozinha quando você sai do app (ou pelo botão na tela do treino).
  No iPhone, o modo de áudio em segundo plano mantém o treino rodando.
- **Tela deitada**: com o celular deitado (ou em tablet e computador), as telas usam duas colunas e a barra de abas fica baixa.
- **Tema claro e escuro**: em Ajustes, Automático (segue o celular), Claro ou Escuro.
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

## Versão web (PWA)

O mesmo código vira o site instalável, com o mesmo design e as mesmas funções do app.

```bash
npm run build:web   # gera a pasta dist (expo export + service worker para abrir sem internet)
```

- Na Vercel, importe este repositório: o `vercel.json` já diz como montar e publicar.
- No navegador, o segundo plano usa um tom inaudível pelo Web Audio (a música de outros apps continua tocando),
  e a janelinha usa o picture-in-picture do navegador. Os bipes saem pelo Web Audio e a voz pelo leitor do aparelho.
- Na primeira abertura no mesmo endereço do site antigo, o histórico, a faixa, o som e o tema salvos nele são trazidos.
- Arquivos só da web terminam em `.web.ts` (em `src/lib`); o app no celular não usa esses arquivos.

## APK para Android

A cada mudança no `main`, o GitHub Actions gera um APK de teste e publica em
[Releases](https://github.com/felipefbezerra/app-bjj-timer/releases).
No celular Android, abra a release mais recente, baixe o `bjj-timer.apk` e toque nele para instalar
(o Android pede para permitir a instalação de apps de fora da Play Store).
Para gerar na hora, use **Actions → APK Android → Run workflow**.

## Estrutura

```
src/app/            telas (expo-router)
  (tabs)/           Combate, Circuito, Cronômetro, Treinos
  treino.tsx        tela do treino em andamento
src/components/     peças de interface (faixa, painéis, ícones, folhas)
src/lib/            regras: sequência de fases, relógio, som/voz, segundo plano, dados salvos, cores
modules/timer-pip/  módulo nativo (Android) da janelinha flutuante
plugins/            ajustes nativos do Android (serviço, janelinha, ícone da notificação)
assets/textures/    tecido do tatame em cada cor
assets/sounds/      bipes e o áudio silencioso que mantém o app vivo em segundo plano
public/             página, manifesto e ícones da versão web (PWA)
scripts/            gera o service worker da versão web depois do build
```

## Verificações

```bash
npx tsc --noEmit
npx eslint .
```

## Próximos passos

- Ícone e tela de abertura próprios (hoje são os do modelo do Expo).
- Relatório semanal.
- No iPhone, a janelinha equivalente seria uma Live Activity (tela de bloqueio e Dynamic Island).
