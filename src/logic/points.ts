import {
  COMEBACK_POINTS,
  DAILY_QUESTS,
  LOG_FILLED_POINTS,
  URGE_BATTLE_MAX_PER_DAY,
  URGE_BATTLE_POINTS,
} from '../config/rules';
import type { DateKey, DayLog } from './types';

export interface DayBreakdown {
  quests: number;
  logFilled: number;
  urgeBattles: number;
  comeback: number;
  total: number;
}

/** Urge battles that count for points (the real count is stored as-is). */
export function countedUrgeBattles(day: Pick<DayLog, 'urge_battles'>): number {
  return Math.max(0, Math.min(URGE_BATTLE_MAX_PER_DAY, Math.floor(day.urge_battles || 0)));
}

export function dayBreakdown(day: DayLog): DayBreakdown {
  const quests = DAILY_QUESTS.reduce((sum, q) => sum + (day[q.field] ? q.points : 0), 0);
  const logFilled = day.log_filled ? LOG_FILLED_POINTS : 0;
  const urgeBattles = countedUrgeBattles(day) * URGE_BATTLE_POINTS;
  const comeback = day.comeback ? COMEBACK_POINTS : 0;
  return { quests, logFilled, urgeBattles, comeback, total: quests + logFilled + urgeBattles + comeback };
}

/** Points for one day. Episodes and sleep quality never affect points. */
export function dayPoints(day: DayLog): number {
  return dayBreakdown(day).total;
}

type Days = DayLog[] | Record<DateKey, DayLog>;
const list = (days: Days) => (Array.isArray(days) ? days : Object.values(days));

/** Total = sum of all days. Nothing is ever subtracted. */
export function totalPoints(days: Days): number {
  return list(days).reduce((sum, d) => sum + dayPoints(d), 0);
}

/** Points earned on or before `upTo` (inclusive). */
export function pointsUpTo(days: Days, upTo: DateKey): number {
  return list(days).reduce((sum, d) => (d.date <= upTo ? sum + dayPoints(d) : sum), 0);
}

/**
 * The first date on which the running total reached `threshold`, or null.
 * Used to know when a level's boss window may start.
 */
export function dateReached(days: Days, threshold: number): DateKey | null {
  if (threshold <= 0) return null;
  const sorted = [...list(days)].sort((a, b) => (a.date < b.date ? -1 : 1));
  let running = 0;
  for (const d of sorted) {
    running += dayPoints(d);
    if (running >= threshold) return d.date;
  }
  return null;
}
