import { DEFAULT_TIMES, LEVELS } from '../config/rules';
import type { DateKey } from '../logic/types';

export interface NotifyToggles {
  dailyLog: boolean;
  followUp: boolean;
  afternoon: boolean;
  windDown: boolean;
  plugIn: boolean;
}

export interface Settings {
  plugInTime: string;
  riskyAfternoonTime: string;
  deskLogTime: string;
  notify: NotifyToggles;
  /** level number → reward text */
  rewards: Record<string, string>;
  lock: { enabled: boolean; useBiometric: boolean };
  startDate: DateKey;
  /** IANA zone the plan is kept in; day keys use the device clock. */
  timezone: string;
  /** The "turn on reminders" card on Today was dismissed. */
  reminderPromptDismissed: boolean;
}

export function defaultSettings(today: DateKey): Settings {
  return {
    plugInTime: DEFAULT_TIMES.plugIn,
    riskyAfternoonTime: DEFAULT_TIMES.riskyAfternoon,
    deskLogTime: DEFAULT_TIMES.deskLog,
    notify: { dailyLog: true, followUp: true, afternoon: true, windDown: true, plugIn: true },
    rewards: Object.fromEntries(LEVELS.map((l) => [String(l.level), l.defaultReward])),
    lock: { enabled: false, useBiometric: false },
    startDate: today,
    timezone: 'Asia/Kolkata',
    reminderPromptDismissed: false,
  };
}

/** Fill in any keys missing from stored settings (e.g. after an update). */
export function mergeSettings(stored: Partial<Settings>, today: DateKey): Settings {
  const d = defaultSettings(today);
  return {
    ...d,
    ...stored,
    notify: { ...d.notify, ...(stored.notify ?? {}) },
    rewards: { ...d.rewards, ...(stored.rewards ?? {}) },
    lock: { ...d.lock, ...(stored.lock ?? {}) },
  };
}
