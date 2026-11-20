import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { logicalDayKey } from '../logic/dates';

/** The logical "today" (rolls over at 04:00), refreshed on resume and every minute. */
export function useToday(): string {
  const [today, setToday] = useState(() => logicalDayKey());
  useEffect(() => {
    const refresh = () => setToday(logicalDayKey());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const t = setInterval(refresh, 60_000);
    return () => {
      sub.remove();
      clearInterval(t);
    };
  }, []);
  return today;
}
