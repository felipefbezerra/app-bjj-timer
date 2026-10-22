import { PermissionsAndroid, Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';

import type { BgInfo } from './background';

// No Android o sistema congela o JavaScript quando o app sai da tela, e o relógio, a voz e os bipes param.
// Um serviço em primeiro plano (com notificação mostrando a fase e o tempo) mantém o treino rodando
// enquanto você usa outro app, como Spotify ou YouTube.

let last = '';

export const Background = {
  async start(info: BgInfo) {
    if (BackgroundService.isRunning()) return;
    if (Number(Platform.Version) >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).catch(() => null);
    }
    last = '';
    try {
      // A tarefa fica "aberta" até o treino acabar; enquanto isso os timers do app continuam valendo.
      await BackgroundService.start(() => new Promise<void>(() => {}), {
        taskName: 'treino',
        taskTitle: info.title,
        taskDesc: info.desc,
        taskIcon: { name: 'ic_stat_bjj', type: 'drawable' },
        color: '#8fe04a',
        foregroundServiceType: ['mediaPlayback'],
        progressBar: { max: 1000, value: Math.round(info.progress * 1000) },
      });
    } catch {}
  },
  update(info: BgInfo) {
    if (!BackgroundService.isRunning()) return;
    const value = Math.round(info.progress * 1000);
    const key = `${info.title}|${info.desc}|${value}`;
    if (key === last) return;
    last = key;
    BackgroundService.updateNotification({ taskTitle: info.title, taskDesc: info.desc, progressBar: { max: 1000, value } }).catch(() => {});
  },
  async stop() {
    last = '';
    if (BackgroundService.isRunning()) await BackgroundService.stop().catch(() => {});
  },
};
