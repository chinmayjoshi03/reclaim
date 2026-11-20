import { LEVELS } from '../config/rules';
import { logicalDayKey } from '../logic/dates';
import {
  emptyLevelState,
  type DateKey,
  type DayLog,
  type LevelState,
  type UrgeSession,
} from '../logic/types';
import { getDb } from './client';
import { DAY_BOOL_FIELDS, LEVEL_BOOL_FIELDS } from './schema';
import { mergeSettings, type Settings } from './settings';

type Row = Record<string, unknown>;

function rowToDay(r: Row): DayLog {
  const out: Row = { ...r };
  for (const f of DAY_BOOL_FIELDS) out[f] = !!r[f];
  out.urge_battles = Number(r.urge_battles ?? 0);
  out.note = (r.note as string) ?? '';
  return out as unknown as DayLog;
}

function rowToLevel(r: Row): LevelState {
  const out: Row = { ...r };
  for (const f of LEVEL_BOOL_FIELDS) out[f] = !!r[f];
  return out as unknown as LevelState;
}

const DAY_COLUMNS = [
  'date',
  ...DAY_BOOL_FIELDS,
  'urge_battles',
  'episodes',
  'sleep_quality',
  'note',
  'updated_at',
] as const;

/* ---------------- day_log ---------------- */

export async function getAllDays(): Promise<DayLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM day_log ORDER BY date');
  return rows.map(rowToDay);
}

export async function upsertDay(day: DayLog): Promise<void> {
  const db = await getDb();
  const values = DAY_COLUMNS.map((c) => {
    const v = day[c as keyof DayLog];
    return typeof v === 'boolean' ? (v ? 1 : 0) : (v as string | number | null);
  });
  await db.runAsync(
    `INSERT OR REPLACE INTO day_log (${DAY_COLUMNS.join(',')}) VALUES (${DAY_COLUMNS.map(() => '?').join(',')})`,
    values,
  );
}

/* ---------------- level_state ---------------- */

export async function getLevelStates(): Promise<LevelState[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM level_state ORDER BY level');
  const byLevel = new Map(rows.map((r) => [Number(r.level), rowToLevel(r)]));
  return LEVELS.map((l) => byLevel.get(l.level) ?? emptyLevelState(l.level));
}

export async function upsertLevelState(s: LevelState): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO level_state
      (level, boss_cleared, cleared_on, blocker_on, passcode_held_by_someone_else, out_of_bed_confirmed, celebrated)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      s.level,
      s.boss_cleared ? 1 : 0,
      s.cleared_on,
      s.blocker_on ? 1 : 0,
      s.passcode_held_by_someone_else ? 1 : 0,
      s.out_of_bed_confirmed ? 1 : 0,
      s.celebrated ? 1 : 0,
    ],
  );
}

/* ---------------- settings ---------------- */

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored: Partial<Settings> = {};
  for (const r of rows) {
    try {
      (stored as Row)[r.key] = JSON.parse(r.value);
    } catch {
      /* ignore a corrupt value; default fills in */
    }
  }
  const merged = mergeSettings(stored, logicalDayKey());
  if (!rows.some((r) => r.key === 'startDate')) await saveSettings(merged);
  return merged;
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const [k, v] of Object.entries(s)) {
      await tx.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, JSON.stringify(v)]);
    }
  });
}

/* ---------------- urge_sessions ---------------- */

export async function addUrgeSession(date: DateKey, startedAt: string): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync('INSERT INTO urge_sessions (date, started_at, completed) VALUES (?, ?, 0)', [
    date,
    startedAt,
  ]);
  return r.lastInsertRowId;
}

export async function finishUrgeSession(id: number, outcome: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE urge_sessions SET completed = 1, outcome = ? WHERE id = ?', [outcome, id]);
}

export async function getUrgeSessions(): Promise<UrgeSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM urge_sessions ORDER BY started_at');
  return rows.map((r) => ({ ...(r as unknown as UrgeSession), completed: !!r.completed }));
}

/* ---------------- whole-database ops (backup / reset / seed) ---------------- */

export async function exportAll(): Promise<{
  days: DayLog[];
  levels: LevelState[];
  settings: Settings;
  urgeSessions: UrgeSession[];
}> {
  const [days, levels, settings, urgeSessions] = await Promise.all([
    getAllDays(),
    getLevelStates(),
    getSettings(),
    getUrgeSessions(),
  ]);
  return { days, levels, settings, urgeSessions };
}

/** Replace everything with imported data, in one transaction. */
export async function importAll(data: {
  days: DayLog[];
  levels: LevelState[];
  settings: Partial<Settings>;
  urgeSessions: UrgeSession[];
}): Promise<void> {
  const db = await getDb();
  const merged = mergeSettings(data.settings, logicalDayKey());
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(
      'DELETE FROM day_log; DELETE FROM level_state; DELETE FROM settings; DELETE FROM urge_sessions;',
    );
    for (const day of data.days) {
      const values = DAY_COLUMNS.map((c) => {
        const v = day[c as keyof DayLog];
        return typeof v === 'boolean' ? (v ? 1 : 0) : (v as string | number | null);
      });
      await tx.runAsync(
        `INSERT OR REPLACE INTO day_log (${DAY_COLUMNS.join(',')}) VALUES (${DAY_COLUMNS.map(() => '?').join(',')})`,
        values,
      );
    }
    for (const s of data.levels) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO level_state
          (level, boss_cleared, cleared_on, blocker_on, passcode_held_by_someone_else, out_of_bed_confirmed, celebrated)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          s.level,
          s.boss_cleared ? 1 : 0,
          s.cleared_on,
          s.blocker_on ? 1 : 0,
          s.passcode_held_by_someone_else ? 1 : 0,
          s.out_of_bed_confirmed ? 1 : 0,
          s.celebrated ? 1 : 0,
        ],
      );
    }
    for (const [k, v] of Object.entries(merged)) {
      await tx.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, JSON.stringify(v)]);
    }
    for (const u of data.urgeSessions) {
      await tx.runAsync('INSERT INTO urge_sessions (date, started_at, completed, outcome) VALUES (?, ?, ?, ?)', [
        u.date,
        u.started_at,
        u.completed ? 1 : 0,
        u.outcome,
      ]);
    }
  });
}

export async function wipeAll(): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(
      'DELETE FROM day_log; DELETE FROM level_state; DELETE FROM settings; DELETE FROM urge_sessions;',
    );
  });
}
