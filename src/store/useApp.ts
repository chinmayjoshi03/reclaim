import { create } from 'zustand';
import * as repo from '../db/repo';
import type { Settings } from '../db/settings';
import { detectClears } from '../logic/bosses';
import { logicalDayKey } from '../logic/dates';
import { applySlip, type SlipFields } from '../logic/slip';
import { emptyDay, type DateKey, type DayLog, type LevelState } from '../logic/types';
import { applyUrgeStart } from '../logic/urge';
import { reschedule } from '../notifications/schedule';

export interface ActiveUrge {
  id: number;
  date: DateKey;
  startedAt: number;
  awarded: boolean;
}

interface AppState {
  ready: boolean;
  error: string | null;
  days: Record<DateKey, DayLog>;
  levels: LevelState[];
  settings: Settings | null;
  /** Set when the app is unlocked (app lock) for this session. */
  unlocked: boolean;
  /** Night screen already shown this session. */
  nightSeen: boolean;

  load: () => Promise<void>;
  getDay: (date: DateKey) => DayLog;
  /**
   * Merge a patch into a day and persist. `markFilled` (default true) sets
   * log_filled, since any save from the log screens counts as filling it in.
   */
  saveDay: (date: DateKey, patch: Partial<DayLog>, opts?: { markFilled?: boolean }) => Promise<DayLog>;
  saveLevel: (level: LevelState) => Promise<void>;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  setUnlocked: (v: boolean) => void;
  setNightSeen: (v: boolean) => void;
  /** Re-plan local notifications from current settings + logs. */
  refreshNotifications: () => Promise<void>;
  /** Check logs for newly beaten bosses and store them (never undone). */
  checkBosses: () => Promise<void>;

  /** The urge timer that is running now (survives leaving the screen). */
  activeUrge: ActiveUrge | null;
  /** Start a timer, or return the one already running. */
  startUrge: () => Promise<ActiveUrge>;
  finishUrge: (outcome: string | null) => Promise<void>;
  /** Log a slip with its trigger. Returns whether a new comeback was earned. */
  logSlip: (date: DateKey, fields: SlipFields) => Promise<boolean>;
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  error: null,
  days: {},
  levels: [],
  settings: null,
  unlocked: false,
  nightSeen: false,

  load: async () => {
    try {
      const [dayList, levels, settings] = await Promise.all([
        repo.getAllDays(),
        repo.getLevelStates(),
        repo.getSettings(),
      ]);
      const days: Record<DateKey, DayLog> = {};
      for (const d of dayList) days[d.date] = d;
      set({ days, levels, settings, ready: true, error: null });
      await get().checkBosses();
      get().refreshNotifications();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },

  getDay: (date) => get().days[date] ?? emptyDay(date),

  saveDay: async (date, patch, opts) => {
    const markFilled = opts?.markFilled ?? true;
    const prev = get().getDay(date);
    const next: DayLog = {
      ...prev,
      ...patch,
      date,
      log_filled: markFilled ? true : prev.log_filled,
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ days: { ...s.days, [date]: next } }));
    await repo.upsertDay(next);
    await get().checkBosses();
    if (!prev.log_filled && next.log_filled) get().refreshNotifications();
    return next;
  },

  saveLevel: async (level) => {
    set((s) => ({ levels: s.levels.map((l) => (l.level === level.level ? level : l)) }));
    await repo.upsertLevelState(level);
    await get().checkBosses();
  },

  checkBosses: async () => {
    const cleared = detectClears(get().days, get().levels, logicalDayKey());
    if (!cleared.length) return;
    const byLevel = new Map(cleared.map((c) => [c.level, c]));
    set((s) => ({ levels: s.levels.map((l) => byLevel.get(l.level) ?? l) }));
    for (const c of cleared) await repo.upsertLevelState(c);
  },

  saveSettings: async (patch) => {
    const cur = get().settings;
    if (!cur) return;
    const next = { ...cur, ...patch };
    set({ settings: next });
    await repo.saveSettings(next);
    get().refreshNotifications();
  },

  refreshNotifications: () => reschedule(() => ({ settings: get().settings, days: get().days })),

  setUnlocked: (v) => set({ unlocked: v }),
  setNightSeen: (v) => set({ nightSeen: v }),

  activeUrge: null,

  startUrge: async () => {
    const running = get().activeUrge;
    if (running) return running;
    const date = logicalDayKey();
    const startedAt = Date.now();
    const { patch, awarded } = applyUrgeStart(get().getDay(date));
    // Reserve the slot synchronously so a double tap cannot start two timers.
    const pending: ActiveUrge = { id: -1, date, startedAt, awarded };
    set({ activeUrge: pending });
    await get().saveDay(date, patch, { markFilled: false });
    const id = await repo.addUrgeSession(date, new Date(startedAt).toISOString());
    const active = { ...pending, id };
    set({ activeUrge: active });
    return active;
  },

  finishUrge: async (outcome) => {
    const a = get().activeUrge;
    set({ activeUrge: null });
    if (a && a.id > 0) await repo.finishUrgeSession(a.id, outcome);
  },

  logSlip: async (date, fields) => {
    const { patch, newComeback } = applySlip(get().getDay(date), fields);
    await get().saveDay(date, patch);
    return newComeback;
  },
}));
