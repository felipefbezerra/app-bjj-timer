import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type TimerPipModule = {
  isSupported(): boolean;
  setEnabled(on: boolean): Promise<void>;
  enter(): Promise<boolean>;
};

// Só existe no Android; no iPhone e na web fica nulo.
const native = Platform.OS === 'android' ? requireOptionalNativeModule<TimerPipModule>('TimerPip') : null;

export const TimerPip = {
  isSupported: () => { try { return !!native?.isSupported(); } catch { return false; } },
  setEnabled: (on: boolean) => { native?.setEnabled(on).catch(() => {}); },
  enter: () => native?.enter().catch(() => false) ?? Promise.resolve(false),
};
