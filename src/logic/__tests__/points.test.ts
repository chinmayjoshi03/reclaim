import { LEVELS } from '../../config/rules';
import { levelHeadline, levelViews } from '../levels';
import { countedUrgeBattles, dateReached, dayBreakdown, dayPoints, pointsUpTo, totalPoints } from '../points';
import { emptyDay, emptyLevelState, type DayLog } from '../types';

const day = (date: string, patch: Partial<DayLog> = {}): DayLog => ({ ...emptyDay(date), ...patch });

const perfect = (date: string) =>
  day(date, {
    phone_off_bed_afternoon: true,
    phone_on_charger: true,
    wind_down: true,
    slept_without_porn: true,
    log_filled: true,
  });

describe('dayPoints', () => {
  it('empty day scores 0', () => {
    expect(dayPoints(day('2026-11-01'))).toBe(0);
  });

  it('each quest has its own value', () => {
    expect(dayPoints(day('d', { phone_off_bed_afternoon: true }))).toBe(10);
    expect(dayPoints(day('d', { phone_on_charger: true }))).toBe(20);
    expect(dayPoints(day('d', { wind_down: true }))).toBe(10);
    expect(dayPoints(day('d', { slept_without_porn: true }))).toBe(15);
    expect(dayPoints(day('d', { log_filled: true }))).toBe(5);
  });

  it('all daily quests = 60', () => {
    expect(dayPoints(perfect('2026-11-01'))).toBe(60);
  });

  it('urge battles: +10 each, capped at 3 per day', () => {
    expect(dayPoints(day('d', { urge_battles: 1 }))).toBe(10);
    expect(dayPoints(day('d', { urge_battles: 3 }))).toBe(30);
    expect(dayPoints(day('d', { urge_battles: 7 }))).toBe(30);
    expect(countedUrgeBattles({ urge_battles: 7 })).toBe(3);
  });

  it('comeback +15', () => {
    expect(dayPoints(day('d', { comeback: true }))).toBe(15);
  });

  it('a slip day still earns: log + comeback + urge battles, never negative', () => {
    const slip = day('d', { log_filled: true, comeback: true, urge_battles: 2, episodes: 2 });
    expect(dayBreakdown(slip)).toEqual({ quests: 0, logFilled: 5, urgeBattles: 20, comeback: 15, total: 40 });
  });

  it('episodes and sleep quality give no points and take none away', () => {
    const a = perfect('d');
    const b = { ...perfect('d'), episodes: 5, sleep_quality: 1 };
    const c = { ...perfect('d'), episodes: 0, sleep_quality: 5 };
    expect(dayPoints(a)).toBe(dayPoints(b));
    expect(dayPoints(a)).toBe(dayPoints(c));
  });

  it('bad data cannot make points negative', () => {
    expect(dayPoints(day('d', { urge_battles: -4 }))).toBe(0);
  });
});

describe('totals', () => {
  const days = [perfect('2026-11-01'), day('2026-11-02', { log_filled: true }), perfect('2026-11-03')];

  it('total is the sum of all days (array or record)', () => {
    expect(totalPoints(days)).toBe(125);
    expect(totalPoints(Object.fromEntries(days.map((d) => [d.date, d])))).toBe(125);
    expect(totalPoints([])).toBe(0);
  });

  it('pointsUpTo is inclusive', () => {
    expect(pointsUpTo(days, '2026-11-02')).toBe(65);
  });

  it('dateReached finds the first day the running total hits a threshold', () => {
    expect(dateReached(days, 60)).toBe('2026-11-01');
    expect(dateReached(days, 61)).toBe('2026-11-02');
    expect(dateReached(days, 66)).toBe('2026-11-03');
    expect(dateReached(days, 1000)).toBeNull();
  });

  it('dateReached ignores input order', () => {
    expect(dateReached([...days].reverse(), 66)).toBe('2026-11-03');
  });
});

describe('levelViews', () => {
  const states = LEVELS.map((l) => emptyLevelState(l.level));

  it('fresh start: level 1 in progress, others locked', () => {
    const v = levelViews(0, states);
    expect(v.map((x) => x.status)).toEqual(['in_progress', 'locked', 'locked', 'locked']);
    expect(levelHeadline(v)).toEqual({ title: 'Level 1 · Bed Guard', subtitle: '250 points to the boss' });
  });

  it('boss ready once points reached', () => {
    const v = levelViews(250, states);
    expect(v[0].status).toBe('boss_ready');
    expect(levelHeadline(v).subtitle).toBe('Beat the boss');
  });

  it('enough points for level 2 does not unlock it until level 1 boss is cleared', () => {
    const v = levelViews(700, states);
    expect(v.map((x) => x.status)).toEqual(['boss_ready', 'locked', 'locked', 'locked']);
  });

  it('after clearing level 1, level 2 shows its own progress', () => {
    const s = states.map((x) => (x.level === 1 ? { ...x, boss_cleared: true } : x));
    const v = levelViews(400, s);
    expect(v.map((x) => x.status)).toEqual(['cleared', 'in_progress', 'locked', 'locked']);
    expect(levelHeadline(v)).toEqual({ title: 'Level 2 · Firewall', subtitle: '200 points to the boss' });
  });

  it('all cleared', () => {
    const s = states.map((x) => ({ ...x, boss_cleared: true }));
    expect(levelHeadline(levelViews(2000, s)).subtitle).toMatch(/All levels cleared/);
  });
});
