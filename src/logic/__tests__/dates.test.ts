import {
  addDays,
  diffDays,
  isNightWindow,
  logicalDayKey,
  rangeKeys,
  toKey,
  weekday,
} from '../dates';

describe('dates', () => {
  it('runs in Asia/Kolkata for these tests', () => {
    expect(new Date(2026, 10, 20).getTimezoneOffset()).toBe(-330);
  });

  it('toKey uses local time, not UTC', () => {
    // 00:10 IST on 21 Nov is still 20 Nov in UTC — the key must be the 21st.
    expect(toKey(new Date(2026, 10, 21, 0, 10))).toBe('2026-11-21');
    // 23:50 IST on 20 Nov.
    expect(toKey(new Date(2026, 10, 20, 23, 50))).toBe('2026-11-20');
  });

  it('addDays crosses month and year ends and leap days', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('diffDays and rangeKeys', () => {
    expect(diffDays('2026-11-01', '2026-11-30')).toBe(29);
    expect(diffDays('2026-11-30', '2026-11-01')).toBe(-29);
    expect(rangeKeys('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02',
    ]);
  });

  it('weekday: 20 Nov 2026 is a Friday', () => {
    expect(weekday('2026-11-20')).toBe(5);
  });

  describe('logical day around midnight', () => {
    it('late evening is still the same day', () => {
      expect(logicalDayKey(new Date(2026, 10, 20, 23, 59))).toBe('2026-11-20');
    });
    it('just after midnight still belongs to last night', () => {
      expect(logicalDayKey(new Date(2026, 10, 21, 0, 1))).toBe('2026-11-20');
      expect(logicalDayKey(new Date(2026, 10, 21, 3, 59))).toBe('2026-11-20');
    });
    it('rolls over at 04:00', () => {
      expect(logicalDayKey(new Date(2026, 10, 21, 4, 0))).toBe('2026-11-21');
    });
    it('rolls over across a month end', () => {
      expect(logicalDayKey(new Date(2026, 11, 1, 1, 0))).toBe('2026-11-30');
    });
  });

  describe('night window', () => {
    it('is on from plug-in time until the morning rollover', () => {
      expect(isNightWindow(new Date(2026, 10, 20, 22, 29), '22:30')).toBe(false);
      expect(isNightWindow(new Date(2026, 10, 20, 22, 30), '22:30')).toBe(true);
      expect(isNightWindow(new Date(2026, 10, 21, 2, 0), '22:30')).toBe(true);
      expect(isNightWindow(new Date(2026, 10, 21, 4, 0), '22:30')).toBe(false);
      expect(isNightWindow(new Date(2026, 10, 21, 14, 0), '22:30')).toBe(false);
    });
    it('handles a plug-in time after midnight', () => {
      expect(isNightWindow(new Date(2026, 10, 21, 0, 30), '00:15')).toBe(true);
      expect(isNightWindow(new Date(2026, 10, 21, 0, 10), '00:15')).toBe(false);
    });
  });
});
