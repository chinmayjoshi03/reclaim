import { URGE_BATTLE_MAX_PER_DAY, URGE_TIMER_MINUTES } from '../config/rules';
import { URGE_STEPS } from '../config/messages';
import type { DayLog } from './types';

export const URGE_TIMER_MS = URGE_TIMER_MINUTES * 60_000;

/** Starting a timer bumps the real count; points only for the first N per day. */
export function applyUrgeStart(day: DayLog): { patch: Partial<DayLog>; awarded: boolean } {
  const before = Math.max(0, day.urge_battles || 0);
  return { patch: { urge_battles: before + 1 }, awarded: before < URGE_BATTLE_MAX_PER_DAY };
}

/** Index of the step that is current after `elapsedMs`. */
export function urgeStepIndex(elapsedMs: number): number {
  const minutes = elapsedMs / 60_000;
  let idx = 0;
  URGE_STEPS.forEach((s, i) => {
    if (minutes >= s.atMinute) idx = i;
  });
  return idx;
}

export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
