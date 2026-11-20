import { addDays, diffDays } from './dates';
import { dayPoints } from './points';
import type { DateKey, DayLog } from './types';

export interface WeekSummary {
  /** 1-based week number since the plan started. */
  number: number;
  start: DateKey;
  end: DateKey;
  /** Days of this week up to today (7 except for the current week). */
  daysSoFar: number;
  loggedDays: number;
  points: number;
  charger: number;
  afternoonsPlanned: number;
  windDowns: number;
  nightsWithoutPorn: number;
  episodes: number;
  /** Average of the sleep ratings given, or null if none. */
  avgSleep: number | null;
}

/** The first day weeks are counted from: plan start, or an earlier log if there is one. */
export function weekOrigin(days: Record<DateKey, DayLog>, startDate: DateKey): DateKey {
  const first = Object.keys(days).sort()[0];
  return first && first < startDate ? first : startDate;
}

/** Weeks of 7 days from `origin`, up to the week containing `today`. Oldest first. */
export function weekSummaries(days: Record<DateKey, DayLog>, origin: DateKey, today: DateKey): WeekSummary[] {
  if (today < origin) return [];
  const count = Math.floor(diffDays(origin, today) / 7) + 1;
  const out: WeekSummary[] = [];
  for (let w = 0; w < count; w++) {
    const start = addDays(origin, w * 7);
    const end = addDays(start, 6);
    const s: WeekSummary = {
      number: w + 1,
      start,
      end,
      daysSoFar: 0,
      loggedDays: 0,
      points: 0,
      charger: 0,
      afternoonsPlanned: 0,
      windDowns: 0,
      nightsWithoutPorn: 0,
      episodes: 0,
      avgSleep: null,
    };
    let sleepSum = 0;
    let sleepN = 0;
    for (let i = 0; i < 7; i++) {
      const k = addDays(start, i);
      if (k > today) break;
      s.daysSoFar += 1;
      const d = days[k];
      if (!d) continue;
      if (d.log_filled) s.loggedDays += 1;
      s.points += dayPoints(d);
      if (d.phone_on_charger) s.charger += 1;
      if (d.afternoon_planned) s.afternoonsPlanned += 1;
      if (d.wind_down) s.windDowns += 1;
      if (d.slept_without_porn) s.nightsWithoutPorn += 1;
      s.episodes += d.episodes ?? 0;
      if (d.sleep_quality) {
        sleepSum += d.sleep_quality;
        sleepN += 1;
      }
    }
    s.avgSleep = sleepN ? Math.round((sleepSum / sleepN) * 10) / 10 : null;
    out.push(s);
  }
  return out;
}
