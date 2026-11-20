import type { Settings } from '../db/settings';
import { emptyDay, emptyLevelState, type DayLog, type LevelState, type UrgeSession } from './types';

export const BACKUP_APP = 'reclaim';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  days: DayLog[];
  levels: LevelState[];
  settings: Partial<Settings>;
  urgeSessions: UrgeSession[];
}

export function buildBackup(data: Omit<Backup, 'app' | 'version' | 'exportedAt'>, now = new Date()): Backup {
  // The app-lock PIN is never part of a backup (it lives in the secure store).
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const bool = (v: unknown) => v === true || v === 1;
const intOrNull = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : null;

function cleanDay(raw: unknown): DayLog | null {
  if (!isObj(raw) || typeof raw.date !== 'string' || !DATE_RE.test(raw.date)) return null;
  const base = emptyDay(raw.date);
  return {
    ...base,
    phone_off_bed_afternoon: bool(raw.phone_off_bed_afternoon),
    phone_on_charger: bool(raw.phone_on_charger),
    wind_down: bool(raw.wind_down),
    slept_without_porn: bool(raw.slept_without_porn),
    log_filled: bool(raw.log_filled),
    urge_battles: intOrNull(raw.urge_battles, 0, 99) ?? 0,
    comeback: bool(raw.comeback),
    afternoon_planned: bool(raw.afternoon_planned),
    got_out_of_bed_when_awake: bool(raw.got_out_of_bed_when_awake),
    episodes: intOrNull(raw.episodes, 0, 99),
    sleep_quality: intOrNull(raw.sleep_quality, 1, 5),
    note: typeof raw.note === 'string' ? raw.note.slice(0, 5000) : '',
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : new Date().toISOString(),
  };
}

function cleanLevel(raw: unknown): LevelState | null {
  if (!isObj(raw) || typeof raw.level !== 'number') return null;
  const cleared = typeof raw.cleared_on === 'string' && DATE_RE.test(raw.cleared_on) ? raw.cleared_on : null;
  return {
    ...emptyLevelState(raw.level),
    boss_cleared: bool(raw.boss_cleared),
    cleared_on: cleared,
    blocker_on: bool(raw.blocker_on),
    passcode_held_by_someone_else: bool(raw.passcode_held_by_someone_else),
    out_of_bed_confirmed: bool(raw.out_of_bed_confirmed),
    celebrated: raw.celebrated === undefined ? true : bool(raw.celebrated),
  };
}

function cleanUrge(raw: unknown): UrgeSession | null {
  if (!isObj(raw) || typeof raw.date !== 'string' || typeof raw.started_at !== 'string') return null;
  return {
    id: 0,
    date: raw.date,
    started_at: raw.started_at,
    completed: bool(raw.completed),
    outcome: typeof raw.outcome === 'string' ? raw.outcome : null,
  };
}

/** Parse and sanitise a backup file. Throws an Error with a friendly message. */
export function parseBackup(text: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t a Reclaim backup (it isn’t valid JSON).');
  }
  if (!isObj(json) || json.app !== BACKUP_APP) throw new Error('That file isn’t a Reclaim backup.');
  if (typeof json.version !== 'number' || json.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of the app.');
  }
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const days = list(json.days).map(cleanDay).filter((d): d is DayLog => !!d);
  const levels = list(json.levels).map(cleanLevel).filter((l): l is LevelState => !!l);
  const urgeSessions = list(json.urgeSessions).map(cleanUrge).filter((u): u is UrgeSession => !!u);
  const settings = isObj(json.settings) ? (json.settings as Partial<Settings>) : {};
  return {
    app: BACKUP_APP,
    version: json.version,
    exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : '',
    days,
    levels,
    settings,
    urgeSessions,
  };
}
