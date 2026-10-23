import { requireOptionalNativeModule, type NativeModule } from 'expo';
import { Platform } from 'react-native';

type Events = { onPipChange: (e: { active: boolean }) => void };
declare class TimerPipModule extends NativeModule<Events> {
  isSupported(): boolean;
  isActive(): boolean;
  setEnabled(on: boolean): Promise<void>;
  enter(): Promise<boolean>;
}

// Só existe no Android; no iPhone e na web fica nulo.
const native = Platform.OS === 'android' ? requireOptionalNativeModule<TimerPipModule>('TimerPip') : null;

export const TimerPip = {
  isSupported: () => { try { return !!native?.isSupported(); } catch { return false; } },
  isActive: () => { try { return !!native?.isActive(); } catch { return false; } },
  setEnabled: (on: boolean) => { native?.setEnabled(on).catch(() => {}); },
  enter: () => native?.enter().catch(() => false) ?? Promise.resolve(false),
  // Avisa quando o app entra ou sai da janelinha.
  onChange: (fn: (active: boolean) => void) => {
    const sub = native?.addListener('onPipChange', e => fn(e.active));
    return () => sub?.remove();
  },
};
