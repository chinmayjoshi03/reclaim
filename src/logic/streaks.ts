import { addDays, daysInMonth } from './dates';
import type { DateKey, DayLog } from './types';

export type DayStatus = 'completed' | 'comeback' | 'not_completed' | 'not_logged';

type Days = Record<DateKey, DayLog>;

/** A day counts as Completed: slept without porn and 0 episodes. */
export function isCompleted(day: DayLog | undefined): boolean {
  return !!day && day.slept_without_porn && (day.episodes ?? 0) === 0;
}

/** Anything at all was recorded for the day. */
export function isLogged(day: DayLog | undefined): boolean {
  if (!day) return false;
  return (
    day.log_filled ||
    day.slept_without_porn ||
    day.comeback ||
    (day.episodes ?? 0) > 0
  );
}

export function dayStatus(day: DayLog | undefined): DayStatus {
  if (isCompleted(day)) return 'completed';
  if (day?.comeback) return 'comeback';
  if (isLogged(day)) return 'not_completed';
  return 'not_logged';
}

/**
 * Consecutive Completed days ending today. If today isn't completed yet
 * (the night isn't over), the streak is counted up to yesterday instead.
 */
export function currentStreak(days: Days, today: DateKey): number {
  let d = isCompleted(days[today]) ? today : addDays(today, -1);
  let n = 0;
  while (isCompleted(days[d])) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

/** Longest run of consecutive Completed days ever (up to and including today). */
export function bestStreak(days: Days, today?: DateKey): number {
  const keys = Object.keys(days)
    .filter((k) => isCompleted(days[k]) && (!today || k <= today))
    .sort();
  let best = 0;
  let run = 0;
  let prev: DateKey | null = null;
  for (const k of keys) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** Completed days in a month (y, m = 1–12), not counting days after `today`. */
export function cleanDaysInMonth(days: Days, y: number, m: number, today?: DateKey): number {
  const prefix = `${y}-${String(m).padStart(2, '0')}-`;
  let n = 0;
  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const k = `${prefix}${String(d).padStart(2, '0')}`;
    if (today && k > today) break;
    if (isCompleted(days[k])) n += 1;
  }
  return n;
}

export interface StreakSummary {
  current: number;
  best: number;
  cleanThisMonth: number;
  /** Gentle line shown when a streak has ended (never "streak lost"). */
  restartMessage: string | null;
}

export function streakSummary(days: Days, today: DateKey): StreakSummary {
  const [y, m] = today.split('-').map(Number);
  const current = currentStreak(days, today);
  const best = bestStreak(days, today);
  const cleanThisMonth = cleanDaysInMonth(days, y, m, today);
  const restartMessage =
    current === 0 && best > 0
      ? `Your best is still ${best}. Clean days this month: ${cleanThisMonth}. Start the next one tonight.`
      : null;
  return { current, best, cleanThisMonth, restartMessage };
}

/** Grid for a month: leading nulls so weeks start on Sunday, then every day key. */
export function monthGrid(y: number, m: number): (DateKey | null)[] {
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells: (DateKey | null)[] = Array(lead).fill(null);
  for (let i = 0; i < daysInMonth(y, m); i++) cells.push(addDays(first, i));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
