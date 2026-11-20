import { LEVELS } from '../../config/rules';
import { bossProgress, detectClears, unlockDate, windowHits } from '../bosses';
import { addDays } from '../dates';
import { emptyDay, emptyLevelState, type DayLog, type LevelState } from '../types';

const L = (n: number) => LEVELS[n - 1];
const states0 = (): LevelState[] => LEVELS.map((l) => emptyLevelState(l.level));
const rec = (ds: DayLog[]) => Object.fromEntries(ds.map((d) => [d.date, d]));

/** An empty day with the given flags. */
function day(date: string, flags: Partial<DayLog> = {}): DayLog {
  return { ...emptyDay(date), ...flags };
}

/** Days ending on `date` (45 pts each from urge battles + comeback) that reach `points` without any quest flag. */
function bank(date: string, points: number): DayLog[] {
  const out: DayLog[] = [];
  let left = points;
  let d = date;
  while (left > 0) {
    out.push(day(d, { urge_battles: 3, comeback: true }));
    left -= 45;
    d = addDays(d, -1);
  }
  return out;
}

describe('windowHits', () => {
  const days = rec([
    day('2026-11-10', { phone_on_charger: true }),
    day('2026-11-12', { phone_on_charger: true }),
    day('2026-11-16', { phone_on_charger: true }),
    day('2026-11-17', { phone_on_charger: true }),
  ]);
  it('counts the 7 days ending on `end`', () => {
    expect(windowHits(days, 'phone_on_charger', '2026-11-16', null)).toBe(3); // 10..16
    expect(windowHits(days, 'phone_on_charger', '2026-11-17', null)).toBe(3); // 11..17
  });
  it('ignores days before the unlock date', () => {
    expect(windowHits(days, 'phone_on_charger', '2026-11-16', '2026-11-12')).toBe(2);
  });
});

describe('unlockDate', () => {
  it('level 1 unlocks the day 250 points is reached', () => {
    const days = rec(bank('2026-11-05', 250)); // 6 days × 45 = 270, ends 11-05
    expect(unlockDate(L(1), days, states0())).toBe('2026-11-05');
  });
  it('level 2 needs level 1 cleared, then the later of points-date and clear-date', () => {
    const days = rec(bank('2026-11-14', 600));
    expect(unlockDate(L(2), days, states0())).toBeNull();
    const s = states0().map((x) => (x.level === 1 ? { ...x, boss_cleared: true, cleared_on: '2026-11-20' } : x));
    expect(unlockDate(L(2), days, s)).toBe('2026-11-20');
    const s2 = states0().map((x) => (x.level === 1 ? { ...x, boss_cleared: true, cleared_on: '2026-10-01' } : x));
    expect(unlockDate(L(2), days, s2)).toBe('2026-11-14');
  });
});

describe('level 1 boss: charger 5 of 7', () => {
  const unlock = '2026-11-05';
  const base = bank(unlock, 250);

  it('nights before the unlock do not count', () => {
    // 5 charger nights entirely before unlock
    const pre = [1, 2, 3, 4].map((i) => day(addDays(unlock, -10 - i), { phone_on_charger: true }));
    const days = rec([...pre, ...base]);
    expect(bossProgress(L(1), days, states0(), '2026-11-08').clearableOn).toBeNull();
  });

  it('4 of 7 is not enough; 5 of 7 clears on the 5th night', () => {
    const nights = ['2026-11-06', '2026-11-07', '2026-11-09', '2026-11-10'];
    let days = rec([...base, ...nights.map((d) => day(d, { phone_on_charger: true }))]);
    let p = bossProgress(L(1), days, states0(), '2026-11-12');
    expect(p.clearableOn).toBeNull();
    expect(p.current[0].text).toBe('4/5 nights this week');

    days = { ...days, '2026-11-12': day('2026-11-12', { phone_on_charger: true }) };
    p = bossProgress(L(1), days, states0(), '2026-11-12');
    expect(p.clearableOn).toBe('2026-11-12');
  });

  it('5 hits spread wider than 7 days do not clear', () => {
    const nights = ['2026-11-06', '2026-11-08', '2026-11-10', '2026-11-12', '2026-11-14'];
    const days = rec([...base, ...nights.map((d) => day(d, { phone_on_charger: true }))]);
    expect(bossProgress(L(1), days, states0(), '2026-11-20').clearableOn).toBeNull();
  });

  it('finds an older window, not only the one ending today', () => {
    const nights = ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'];
    const days = rec([...base, ...nights.map((d) => day(d, { phone_on_charger: true }))]);
    const p = bossProgress(L(1), days, states0(), '2026-11-30');
    expect(p.clearableOn).toBe('2026-11-10');
    expect(p.current[0].hits).toBe(0); // this week's progress is separate
  });
});

describe('level 2 boss: manual toggles + afternoons planned', () => {
  const l1Cleared = (extra: Partial<LevelState> = {}) =>
    states0().map((x) =>
      x.level === 1 ? { ...x, boss_cleared: true, cleared_on: '2026-11-01' } : x.level === 2 ? { ...x, ...extra } : x,
    );
  const days = rec([
    ...bank('2026-11-05', 600),
    ...['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'].map((d) =>
      day(d, { afternoon_planned: true }),
    ),
  ]);

  it('needs both manual toggles', () => {
    expect(bossProgress(L(2), days, l1Cleared(), '2026-11-10').clearableOn).toBeNull();
    expect(bossProgress(L(2), days, l1Cleared({ blocker_on: true }), '2026-11-10').clearableOn).toBeNull();
    expect(
      bossProgress(L(2), days, l1Cleared({ blocker_on: true, passcode_held_by_someone_else: true }), '2026-11-10')
        .clearableOn,
    ).toBe('2026-11-10');
  });
});

describe('level 3 boss: two counts in the same window, or manual confirm', () => {
  const states = () =>
    states0().map((x) => (x.level <= 2 ? { ...x, boss_cleared: true, cleared_on: '2026-11-01' } : x));
  const wind = ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'];

  it('both counts must hit 5 in the same 7 days', () => {
    const out = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16'];
    const days = rec([
      ...bank('2026-11-05', 1000),
      ...wind.map((d) => day(d, { wind_down: true })),
      ...out.map((d) => day(d, { got_out_of_bed_when_awake: true })),
    ]);
    expect(bossProgress(L(3), days, states(), '2026-11-20').clearableOn).toBeNull();
  });

  it('manual confirm replaces the out-of-bed count', () => {
    const days = rec([...bank('2026-11-05', 1000), ...wind.map((d) => day(d, { wind_down: true }))]);
    const s = states().map((x) => (x.level === 3 ? { ...x, out_of_bed_confirmed: true } : x));
    const p = bossProgress(L(3), days, s, '2026-11-10');
    expect(p.clearableOn).toBe('2026-11-10');
    expect(p.current[1].text).toBe('Confirmed');
  });
});

describe('detectClears', () => {
  it('returns nothing when nothing is beaten', () => {
    expect(detectClears({}, states0(), '2026-11-20')).toEqual([]);
  });

  it('clears level 1 and records the window end date', () => {
    const nights = ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'];
    const days = rec([...bank('2026-11-05', 250), ...nights.map((d) => day(d, { phone_on_charger: true }))]);
    const r = detectClears(days, states0(), '2026-11-20');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ level: 1, boss_cleared: true, cleared_on: '2026-11-10', celebrated: false });
  });

  it('a stored clear is never undone, even if logs change', () => {
    const s = states0().map((x) => (x.level === 1 ? { ...x, boss_cleared: true, cleared_on: '2026-11-10' } : x));
    expect(detectClears({}, s, '2026-11-20')).toEqual([]);
  });

  it('chains clears in order, but stops at a level whose manual items are not done', () => {
    // Plenty of points and every flag every night — but level 2 needs manual toggles, so the chain stops at 1.
    const all = Array.from({ length: 40 }, (_, i) =>
      day(addDays('2026-10-10', i), {
        phone_off_bed_afternoon: true,
        phone_on_charger: true,
        wind_down: true,
        slept_without_porn: true,
        log_filled: true,
        urge_battles: 3,
        comeback: true,
        afternoon_planned: true,
        got_out_of_bed_when_awake: true,
      }),
    );
    const r = detectClears(rec(all), states0(), '2026-11-18');
    expect(r.map((x) => x.level)).toEqual([1]);

    // With the manual toggles on, the chain clears every level in order.
    const s = states0().map((x) => (x.level === 2 ? { ...x, blocker_on: true, passcode_held_by_someone_else: true } : x));
    const r2 = detectClears(rec(all), s, '2026-11-18');
    expect(r2.map((x) => x.level)).toEqual([1, 2, 3, 4]);
    // Each clear date is on/after the previous one.
    const dates = r2.map((x) => x.cleared_on!);
    expect([...dates].sort()).toEqual(dates);
  });
});
