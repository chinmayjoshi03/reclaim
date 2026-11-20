import type { ManualField } from '../config/rules';

/** YYYY-MM-DD in local time. */
export type DateKey = string;

export interface DayLog {
  date: DateKey;
  phone_off_bed_afternoon: boolean;
  phone_on_charger: boolean;
  wind_down: boolean;
  slept_without_porn: boolean;
  log_filled: boolean;
  urge_battles: number;
  comeback: boolean;
  afternoon_planned: boolean;
  got_out_of_bed_when_awake: boolean;
  episodes: number | null;
  sleep_quality: number | null;
  note: string;
  updated_at: string;
}

export interface LevelState {
  level: number;
  boss_cleared: boolean;
  cleared_on: DateKey | null;
  blocker_on: boolean;
  passcode_held_by_someone_else: boolean;
  out_of_bed_confirmed: boolean;
  /** The "Boss beaten" screen has been shown. */
  celebrated: boolean;
}

export type ManualFlags = Pick<LevelState, ManualField>;

export interface UrgeSession {
  id: number;
  date: DateKey;
  started_at: string;
  completed: boolean;
  outcome: string | null;
}

export function emptyDay(date: DateKey): DayLog {
  return {
    date,
    phone_off_bed_afternoon: false,
    phone_on_charger: false,
    wind_down: false,
    slept_without_porn: false,
    log_filled: false,
    urge_battles: 0,
    comeback: false,
    afternoon_planned: false,
    got_out_of_bed_when_awake: false,
    episodes: null,
    sleep_quality: null,
    note: '',
    updated_at: '',
  };
}

export function emptyLevelState(level: number): LevelState {
  return {
    level,
    boss_cleared: false,
    cleared_on: null,
    blocker_on: false,
    passcode_held_by_someone_else: false,
    out_of_bed_confirmed: false,
    celebrated: false,
  };
}
