import { buildBackup, parseBackup } from '../backup';
import { emptyDay, emptyLevelState } from '../types';

const day = { ...emptyDay('2026-11-20'), log_filled: true, phone_on_charger: true, episodes: 1, sleep_quality: 4, note: 'x' };
const level = { ...emptyLevelState(1), boss_cleared: true, cleared_on: '2026-11-10', celebrated: true };
const urge = { id: 7, date: '2026-11-20', started_at: '2026-11-20T17:00:00.000Z', completed: true, outcome: 'passed' };

describe('backup', () => {
  it('round-trips', () => {
    const b = buildBackup({ days: [day], levels: [level], settings: { plugInTime: '23:00' }, urgeSessions: [urge] });
    const back = parseBackup(JSON.stringify(b));
    expect(back.days).toEqual([day]);
    expect(back.levels).toEqual([level]);
    expect(back.settings).toEqual({ plugInTime: '23:00' });
    expect(back.urgeSessions[0]).toMatchObject({ date: urge.date, outcome: 'passed', completed: true });
  });

  it('never contains a PIN field', () => {
    const b = buildBackup({ days: [], levels: [], settings: {}, urgeSessions: [] });
    expect(JSON.stringify(b).toLowerCase()).not.toContain('pin');
  });

  it('rejects non-JSON and other files with a friendly message', () => {
    expect(() => parseBackup('hello')).toThrow(/isn’t a Reclaim backup/);
    expect(() => parseBackup('{"foo":1}')).toThrow(/isn’t a Reclaim backup/);
    expect(() => parseBackup('[]')).toThrow(/isn’t a Reclaim backup/);
  });

  it('rejects a newer version', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'reclaim', version: 99 }))).toThrow(/newer version/);
  });

  it('drops bad rows and clamps bad values', () => {
    const b = parseBackup(
      JSON.stringify({
        app: 'reclaim',
        version: 1,
        days: [
          { date: 'not-a-date' },
          { date: '2026-11-01', sleep_quality: 9, episodes: -3, urge_battles: 'x', phone_on_charger: 1, note: 5 },
          null,
        ],
        levels: [{ nope: true }],
      }),
    );
    expect(b.days).toHaveLength(1);
    expect(b.days[0]).toMatchObject({ sleep_quality: 5, episodes: 0, urge_battles: 0, phone_on_charger: true, note: '' });
    expect(b.levels).toEqual([]);
    expect(b.urgeSessions).toEqual([]);
  });
});
