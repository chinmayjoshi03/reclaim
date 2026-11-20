import { applySlip, slipHasContent, slipNoteLine } from '../slip';
import { dayPoints } from '../points';
import { emptyDay } from '../types';
import { applyUrgeStart, formatCountdown, urgeStepIndex } from '../urge';

describe('urge timer', () => {
  it('awards points for the first 3 starts only, but keeps the real count', () => {
    let day = emptyDay('2026-11-20');
    const awarded: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      const r = applyUrgeStart(day);
      awarded.push(r.awarded);
      day = { ...day, ...r.patch };
    }
    expect(awarded).toEqual([true, true, true, false, false]);
    expect(day.urge_battles).toBe(5);
    expect(dayPoints(day)).toBe(30);
  });

  it('steps follow the clock', () => {
    expect(urgeStepIndex(0)).toBe(0);
    expect(urgeStepIndex(59_000)).toBe(0);
    expect(urgeStepIndex(60_000)).toBe(1);
    expect(urgeStepIndex(5 * 60_000)).toBe(2);
    expect(urgeStepIndex(14 * 60_000)).toBe(3);
  });

  it('formats the countdown', () => {
    expect(formatCountdown(15 * 60_000)).toBe('15:00');
    expect(formatCountdown(61_000)).toBe('1:01');
    expect(formatCountdown(-5)).toBe('0:00');
  });
});

describe('slip / comeback', () => {
  const f = { time: '23:40', place: 'bed', feeling: 'bored', change: 'phone in kitchen' };

  it('needs at least one line', () => {
    expect(slipHasContent({ time: ' ', place: '', feeling: '', change: '' })).toBe(false);
    expect(slipHasContent({ ...f, time: '' })).toBe(true);
  });

  it('builds a readable note line', () => {
    expect(slipNoteLine(f)).toBe('Slip 23:40 — place: bed · feeling: bored · next time: phone in kitchen');
    expect(slipNoteLine({ time: '', place: '', feeling: 'tired', change: '' })).toBe('Slip — feeling: tired');
  });

  it('adds an episode, sets comeback (+15) and appends to the note', () => {
    const day = { ...emptyDay('d'), log_filled: true, note: 'Long day' };
    const { patch, newComeback } = applySlip(day, f);
    expect(newComeback).toBe(true);
    expect(patch.episodes).toBe(1);
    expect(patch.note).toBe(`Long day\n${slipNoteLine(f)}`);
    expect(dayPoints({ ...day, ...patch })).toBe(5 + 15);
  });

  it('a second slip the same day adds an episode but no extra comeback points', () => {
    const day = { ...emptyDay('d'), comeback: true, episodes: 1, note: 'x' };
    const { patch, newComeback } = applySlip(day, f);
    expect(newComeback).toBe(false);
    expect(patch.episodes).toBe(2);
    expect(dayPoints({ ...day, ...patch })).toBe(15);
  });
});
