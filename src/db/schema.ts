/**
 * SQLite schema. Each entry in MIGRATIONS runs once, in order, tracked with
 * PRAGMA user_version. Never edit an old migration — append a new one.
 */
export const MIGRATIONS: string[] = [
  /* 1 */ `
  CREATE TABLE IF NOT EXISTS day_log (
    date TEXT PRIMARY KEY NOT NULL,
    phone_off_bed_afternoon INTEGER NOT NULL DEFAULT 0,
    phone_on_charger INTEGER NOT NULL DEFAULT 0,
    wind_down INTEGER NOT NULL DEFAULT 0,
    slept_without_porn INTEGER NOT NULL DEFAULT 0,
    log_filled INTEGER NOT NULL DEFAULT 0,
    urge_battles INTEGER NOT NULL DEFAULT 0,
    comeback INTEGER NOT NULL DEFAULT 0,
    afternoon_planned INTEGER NOT NULL DEFAULT 0,
    got_out_of_bed_when_awake INTEGER NOT NULL DEFAULT 0,
    episodes INTEGER,
    sleep_quality INTEGER CHECK (sleep_quality IS NULL OR sleep_quality BETWEEN 1 AND 5),
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS level_state (
    level INTEGER PRIMARY KEY NOT NULL,
    boss_cleared INTEGER NOT NULL DEFAULT 0,
    cleared_on TEXT,
    blocker_on INTEGER NOT NULL DEFAULT 0,
    passcode_held_by_someone_else INTEGER NOT NULL DEFAULT 0,
    out_of_bed_confirmed INTEGER NOT NULL DEFAULT 0,
    celebrated INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS urge_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    outcome TEXT
  );
  CREATE INDEX IF NOT EXISTS urge_sessions_date ON urge_sessions(date);
  `,
];

export const DAY_BOOL_FIELDS = [
  'phone_off_bed_afternoon',
  'phone_on_charger',
  'wind_down',
  'slept_without_porn',
  'log_filled',
  'comeback',
  'afternoon_planned',
  'got_out_of_bed_when_awake',
] as const;

export const LEVEL_BOOL_FIELDS = [
  'boss_cleared',
  'blocker_on',
  'passcode_held_by_someone_else',
  'out_of_bed_confirmed',
  'celebrated',
] as const;
