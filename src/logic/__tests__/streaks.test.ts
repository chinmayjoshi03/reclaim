import { addDays } from '../dates';
import {
  bestStreak,
  cleanDaysInMonth,
  currentStreak,
  dayStatus,
  monthGrid,
  streakSummary,
} from '../streaks';
import { emptyDay, type DayLog } from '../types';

const clean = (date: string): DayLog => ({ ...emptyDay(date), slept_without_porn: true, log_filled: true, episodes: 0 });
const slip = (date: string, comeback = false): DayLog => ({ ...emptyDay(date), log_filled: true, episodes: 1, comeback });
const rec = (...ds: DayLog[]) => Object.fromEntries(ds.map((d) => [d.date, d]));

describe('dayStatus', () => {
  it('classifies days', () => {
    expect(dayStatus(clean('d'))).toBe('completed');
    expect(dayStatus({ ...clean('d'), episodes: null })).toBe('completed');
    expect(dayStatus(slip('d', true))).toBe('comeback');
    expect(dayStatus(slip('d'))).toBe('not_completed');
    expect(dayStatus({ ...emptyDay('d'), log_filled: true })).toBe('not_completed');
    expect(dayStatus(undefined)).toBe('not_logged');
    expect(dayStatus(emptyDay('d'))).toBe('not_logged');
  });

  it('ticked "slept without porn" but logged an episode is not completed', () => {
    expect(dayStatus({ ...clean('d'), episodes: 1 })).toBe('not_completed');
    expect(dayStatus({ ...clean('d'), episodes: 1, comeback: true })).toBe('comeback');
  });

  it('only urge battles (log not filled) still counts as not logged', () => {
    expect(dayStatus({ ...emptyDay('d'), urge_battles: 2 })).toBe('not_logged');
  });
});

describe('streaks', () => {
  const today = '2026-11-20';

  it('counts back from today when today is completed', () => {
    const days = rec(clean('2026-11-18'), clean('2026-11-19'), clean('2026-11-20'));
    expect(currentStreak(days, today)).toBe(3);
  });

  it('today not logged yet does not break the streak', () => {
    const days = rec(clean('2026-11-18'), clean('2026-11-19'));
    expect(currentStreak(days, today)).toBe(2);
  });

  it('a gap or a slip ends the current streak', () => {
    expect(currentStreak(rec(clean('2026-11-17'), clean('2026-11-18')), today)).toBe(0);
    expect(currentStreak(rec(clean('2026-11-18'), slip('2026-11-19', true)), today)).toBe(0);
  });

  it('a comeback day does not count toward a streak', () => {
    const days = rec(clean('2026-11-17'), slip('2026-11-18', true), clean('2026-11-19'), clean('2026-11-20'));
    expect(currentStreak(days, today)).toBe(2);
    expect(bestStreak(days)).toBe(2);
  });

  it('best streak finds the longest run, across month ends', () => {
    const days = rec(
      clean('2026-10-29'), clean('2026-10-30'), clean('2026-10-31'), clean('2026-11-01'),
      slip('2026-11-02'),
      clean('2026-11-03'), clean('2026-11-04'),
    );
    expect(bestStreak(days)).toBe(4);
    expect(bestStreak({})).toBe(0);
  });

  it('best streak ignores days after today', () => {
    const days = rec(clean('2026-11-20'), clean('2026-11-21'), clean('2026-11-22'));
    expect(bestStreak(days, today)).toBe(1);
  });

  it('long streaks', () => {
    const list = Array.from({ length: 40 }, (_, i) => clean(addDays('2026-10-12', i)));
    expect(currentStreak(rec(...list), '2026-11-20')).toBe(40);
  });
});

describe('clean days this month', () => {
  it('counts only completed days in that month', () => {
    const days = rec(clean('2026-10-31'), clean('2026-11-01'), slip('2026-11-02', true), clean('2026-11-15'), clean('2026-12-01'));
    expect(cleanDaysInMonth(days, 2026, 11)).toBe(2);
    expect(cleanDaysInMonth(days, 2026, 10)).toBe(1);
  });
  it('stops at today', () => {
    expect(cleanDaysInMonth(rec(clean('2026-11-10'), clean('2026-11-25')), 2026, 11, '2026-11-20')).toBe(1);
  });
});

describe('streakSummary', () => {
  it('no restart message while a streak is running or before any streak', () => {
    expect(streakSummary(rec(clean('2026-11-19')), '2026-11-20').restartMessage).toBeNull();
    expect(streakSummary({}, '2026-11-20').restartMessage).toBeNull();
  });
  it('gentle restart message when a streak ended', () => {
    const s = streakSummary(rec(clean('2026-11-10'), clean('2026-11-11'), clean('2026-11-12'), slip('2026-11-19')), '2026-11-20');
    expect(s).toMatchObject({ current: 0, best: 3, cleanThisMonth: 3 });
    expect(s.restartMessage).toBe('Your best is still 3. Clean days this month: 3. Start the next one tonight.');
    expect(s.restartMessage).not.toMatch(/lost|0 days/i);
  });
});

describe('monthGrid', () => {
  it('November 2026 starts on a Sunday', () => {
    const g = monthGrid(2026, 11);
    expect(g[0]).toBe('2026-11-01');
    expect(g.filter(Boolean)).toHaveLength(30);
    expect(g.length % 7).toBe(0);
  });
  it('April 2026 starts on a Wednesday (3 leading blanks)', () => {
    expect(monthGrid(2026, 4).slice(0, 4)).toEqual([null, null, null, '2026-04-01']);
  });
});
