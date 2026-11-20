import { BANNED_WORDS, LOCKSCREEN_BANNED, NOTIFICATIONS } from '../../config/messages';
import { defaultSettings } from '../../db/settings';
import { nextFollowUp, pickVariant, planNotifications, reminderTimes } from '../../notifications/plan';
import { emptyDay } from '../types';

const s = defaultSettings('2026-11-01');
const rec = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, { ...emptyDay(k), log_filled: true }]));

describe('notification copy', () => {
  const all = Object.values(NOTIFICATIONS).flatMap((n) => [n.title, ...n.bodies]);
  it('has 5–8 variants per type', () => {
    for (const n of Object.values(NOTIFICATIONS)) {
      expect(n.bodies.length).toBeGreaterThanOrEqual(5);
      expect(n.bodies.length).toBeLessThanOrEqual(8);
    }
  });
  it.each([...LOCKSCREEN_BANNED, ...BANNED_WORDS])('lock-screen text never says "%s"', (w) => {
    for (const t of all) expect(t.toLowerCase()).not.toContain(w);
  });
  it('rotates by day', () => {
    const a = pickVariant('plugIn', '2026-11-20');
    const b = pickVariant('plugIn', '2026-11-21');
    expect(a).not.toBe(b);
    expect(pickVariant('plugIn', '2026-11-20')).toBe(a);
  });
});

describe('reminder times', () => {
  it('derive from settings', () => {
    expect(reminderTimes(s)).toEqual({ dailyLog: '10:00', afternoon: '14:45', windDown: '22:00', plugIn: '22:30' });
  });
  it('wrap around midnight', () => {
    expect(reminderTimes({ ...s, plugInTime: '00:15' }).windDown).toBe('23:45');
  });
});

describe('follow-up', () => {
  it('today 18:00 if yesterday is empty', () => {
    const when = nextFollowUp({}, new Date(2026, 10, 20, 11, 0));
    expect(when).toEqual(new Date(2026, 10, 20, 18, 0));
  });
  it('skips today if yesterday is logged; then tomorrow 18:00 checks today', () => {
    const when = nextFollowUp(rec('2026-11-19'), new Date(2026, 10, 20, 11, 0));
    expect(when).toEqual(new Date(2026, 10, 21, 18, 0));
  });
  it('none if both yesterday and today are logged', () => {
    expect(nextFollowUp(rec('2026-11-19', '2026-11-20'), new Date(2026, 10, 20, 11, 0))).toBeNull();
  });
  it('after 18:00 moves to tomorrow', () => {
    expect(nextFollowUp({}, new Date(2026, 10, 20, 19, 0))).toEqual(new Date(2026, 10, 21, 18, 0));
  });
  it('just after midnight: today 18:00 checks the calendar day before', () => {
    expect(nextFollowUp(rec('2026-11-19'), new Date(2026, 10, 21, 0, 30))).toEqual(new Date(2026, 10, 21, 18, 0));
  });
});

describe('planNotifications', () => {
  const now = new Date(2026, 10, 20, 11, 0);
  it('max 5, ids unique, plug-in opens night screen', () => {
    const p = planNotifications(s, {}, now);
    expect(p).toHaveLength(5);
    expect(new Set(p.map((x) => x.id)).size).toBe(5);
    expect(p.find((x) => x.type === 'plugIn')?.url).toBe('/night');
    expect(p.find((x) => x.type === 'windDown')?.trigger).toEqual({ kind: 'daily', hour: 22, minute: 0 });
  });
  it('respects the toggles', () => {
    const p = planNotifications({ ...s, notify: { ...s.notify, afternoon: false, followUp: false } }, {}, now);
    expect(p.map((x) => x.type).sort()).toEqual(['dailyLog', 'plugIn', 'windDown']);
  });
  it('no follow-up when nothing is missing', () => {
    const p = planNotifications(s, rec('2026-11-19', '2026-11-20'), now);
    expect(p.some((x) => x.type === 'followUp')).toBe(false);
  });
});
