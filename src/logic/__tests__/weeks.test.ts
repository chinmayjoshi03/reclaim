import { addDays } from '../dates';
import { emptyDay, type DayLog } from '../types';
import { weekOrigin, weekSummaries } from '../weeks';

const rec = (ds: DayLog[]) => Object.fromEntries(ds.map((d) => [d.date, d]));

describe('weekSummaries', () => {
  it('splits into 7-day weeks from the origin, last one partial', () => {
    const w = weekSummaries({}, '2026-11-01', '2026-11-20');
    expect(w.map((x) => [x.start, x.end, x.daysSoFar])).toEqual([
      ['2026-11-01', '2026-11-07', 7],
      ['2026-11-08', '2026-11-14', 7],
      ['2026-11-15', '2026-11-21', 6],
    ]);
  });

  it('first day of the plan is week 1 with 1 day so far', () => {
    const w = weekSummaries({}, '2026-11-20', '2026-11-20');
    expect(w).toHaveLength(1);
    expect(w[0].daysSoFar).toBe(1);
  });

  it('sums each measure and averages sleep over rated days only', () => {
    const days = rec([
      { ...emptyDay('2026-11-01'), log_filled: true, phone_on_charger: true, wind_down: true, slept_without_porn: true, sleep_quality: 4, episodes: 0 },
      { ...emptyDay('2026-11-02'), log_filled: true, afternoon_planned: true, episodes: 2, comeback: true, sleep_quality: 2 },
      { ...emptyDay('2026-11-03'), log_filled: true, phone_on_charger: true },
      { ...emptyDay('2026-11-08'), log_filled: true, episodes: 1 },
    ]);
    const [w1, w2] = weekSummaries(days, '2026-11-01', '2026-11-10');
    expect(w1).toMatchObject({
      loggedDays: 3,
      charger: 2,
      afternoonsPlanned: 1,
      windDowns: 1,
      nightsWithoutPorn: 1,
      episodes: 2,
      avgSleep: 3,
      points: 50 + 20 + 25,
    });
    expect(w2).toMatchObject({ episodes: 1, avgSleep: null, points: 5 });
  });

  it('ignores logs after today', () => {
    const days = rec([{ ...emptyDay('2026-11-21'), log_filled: true, phone_on_charger: true }]);
    expect(weekSummaries(days, '2026-11-15', '2026-11-20')[0].charger).toBe(0);
  });

  it('origin moves back if a log predates the plan start', () => {
    const days = rec([emptyDay('2026-10-30')]);
    expect(weekOrigin(days, '2026-11-01')).toBe('2026-10-30');
    expect(weekOrigin({}, '2026-11-01')).toBe('2026-11-01');
  });

  it('handles a long plan', () => {
    const w = weekSummaries({}, '2026-01-01', addDays('2026-01-01', 364));
    expect(w).toHaveLength(53);
  });
});
