import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { hasPin } from '../lock/pin';
import { useApp } from '../store/useApp';
import { LockScreen } from './LockScreen';

/** Re-lock after the app has been in the background this long (share sheet, file picker, etc. are shorter). */
const RELOCK_AFTER_MS = 30_000;

export function LockGate() {
  const enabled = useApp((s) => s.settings?.lock.enabled ?? false);
  const unlocked = useApp((s) => s.unlocked);
  const setUnlocked = useApp((s) => s.setUnlocked);
  const leftAt = useRef<number | null>(null);

  // Lock on but no PIN stored (e.g. data restored onto a new phone): turn the lock off rather than lock you out.
  useEffect(() => {
    if (!enabled) return;
    hasPin().then((ok) => {
      if (!ok) useApp.getState().saveSettings({ lock: { enabled: false, useBiometric: false } });
    });
  }, [enabled]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') leftAt.current = Date.now();
      if (s === 'active' && leftAt.current !== null) {
        if (Date.now() - leftAt.current > RELOCK_AFTER_MS) setUnlocked(false);
        leftAt.current = null;
      }
    });
    return () => sub.remove();
  }, [setUnlocked]);

  if (!enabled || unlocked) return null;
  return <LockScreen />;
}
