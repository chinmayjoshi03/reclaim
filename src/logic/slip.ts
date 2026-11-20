import type { DayLog } from './types';

export interface SlipFields {
  time: string;
  place: string;
  feeling: string;
  change: string;
}

export function slipHasContent(f: SlipFields): boolean {
  return Object.values(f).some((v) => v.trim().length > 0);
}

/** One readable line for the day's note. */
export function slipNoteLine(f: SlipFields): string {
  const parts: string[] = [];
  if (f.place.trim()) parts.push(`place: ${f.place.trim()}`);
  if (f.feeling.trim()) parts.push(`feeling: ${f.feeling.trim()}`);
  if (f.change.trim()) parts.push(`next time: ${f.change.trim()}`);
  const head = f.time.trim() ? `Slip ${f.time.trim()}` : 'Slip';
  return parts.length ? `${head} — ${parts.join(' · ')}` : head;
}

/**
 * A logged slip: one more episode, comeback earned, trigger appended to the note.
 * Comeback is a yes/no per day, so a second slip the same day adds no extra points.
 */
export function applySlip(day: DayLog, f: SlipFields): { patch: Partial<DayLog>; newComeback: boolean } {
  const line = slipNoteLine(f);
  const note = day.note.trim() ? `${day.note.trim()}\n${line}` : line;
  return {
    patch: { episodes: (day.episodes ?? 0) + 1, comeback: true, note },
    newComeback: !day.comeback,
  };
}
