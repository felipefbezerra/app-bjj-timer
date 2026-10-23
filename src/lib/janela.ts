import { TimerPip } from '../../modules/timer-pip';

// Janelinha flutuante com o tempo e a posição.
// No app (Android) é o picture-in-picture do sistema: a própria tela do treino encolhe e
// troca para o layout compacto (inline). No iPhone ainda não existe. A versão web fica em janela.web.ts.

export type JanelaInfo = { time: string; label: string; color: string };

export const Janela = {
  inline: true,
  isSupported: () => TimerPip.isSupported(),
  isActive: () => TimerPip.isActive(),
  setAuto: (on: boolean) => TimerPip.setEnabled(on),
  open: () => { TimerPip.enter(); },
  close: () => {},
  update: (_info: JanelaInfo) => {},
  onChange: (fn: (active: boolean) => void) => TimerPip.onChange(fn),
};
