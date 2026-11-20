import { BOSS_REQUIRED_HITS, BOSS_WINDOW_DAYS, LEVELS, type BossRequirement, type LevelRule } from '../config/rules';
import { addDays, rangeKeys } from './dates';
import { dateReached } from './points';
import { emptyLevelState, type DateKey, type DayLog, type LevelState } from './types';

type Days = Record<DateKey, DayLog>;

export interface RequirementProgress {
  req: BossRequirement;
  /** Hits in the window (count requirements). */
  hits: number;
  need: number;
  met: boolean;
  /** e.g. "4/5 nights this week" or "Done" */
  text: string;
}

export interface BossProgress {
  level: number;
  /** First day the boss could be fought (points reached and previous level cleared). */
  unlockedOn: DateKey | null;
  /** Progress in the 7-day window ending today (only days on/after unlock count). */
  current: RequirementProgress[];
  /** First window end date where everything was met, if any. */
  clearableOn: DateKey | null;
}

const stateFor = (states: LevelState[], level: number) =>
  states.find((s) => s.level === level) ?? emptyLevelState(level);

/** When a level's boss becomes available, or null if not yet. */
export function unlockDate(rule: LevelRule, days: Days, states: LevelState[], rules: LevelRule[] = LEVELS): DateKey | null {
  const reached = dateReached(days, rule.points);
  if (!reached) return null;
  const idx = rules.findIndex((r) => r.level === rule.level);
  if (idx <= 0) return reached;
  const prev = stateFor(states, rules[idx - 1].level);
  if (!prev.boss_cleared || !prev.cleared_on) return null;
  return prev.cleared_on > reached ? prev.cleared_on : reached;
}

/** Count of days in the window [end-6, end] with `field` set, ignoring days before `from`. */
export function windowHits(days: Days, field: keyof DayLog, end: DateKey, from: DateKey | null): number {
  let n = 0;
  for (const d of rangeKeys(addDays(end, -(BOSS_WINDOW_DAYS - 1)), end)) {
    if (from && d < from) continue;
    if (days[d]?.[field]) n += 1;
  }
  return n;
}

function evaluate(
  rule: LevelRule,
  days: Days,
  state: LevelState,
  end: DateKey,
  from: DateKey | null,
): RequirementProgress[] {
  return rule.boss.map((req) => {
    if (req.kind === 'manual') {
      const met = !!state[req.field];
      return { req, hits: met ? 1 : 0, need: 1, met, text: met ? 'Done' : 'Not yet' };
    }
    const hits = windowHits(days, req.field, end, from);
    const override = req.manualOverride ? !!state[req.manualOverride] : false;
    const met = override || hits >= BOSS_REQUIRED_HITS;
    const text = override && hits < BOSS_REQUIRED_HITS
      ? 'Confirmed'
      : `${Math.min(hits, BOSS_WINDOW_DAYS)}/${BOSS_REQUIRED_HITS} ${req.unit} this week`;
    return { req, hits, need: BOSS_REQUIRED_HITS, met, text };
  });
}

export function bossProgress(
  rule: LevelRule,
  days: Days,
  states: LevelState[],
  today: DateKey,
  rules: LevelRule[] = LEVELS,
): BossProgress {
  const state = stateFor(states, rule.level);
  const unlockedOn = unlockDate(rule, days, states, rules);
  // Before unlock, show a practice view of the last 7 days.
  const current = evaluate(rule, days, state, today, unlockedOn);
  let clearableOn: DateKey | null = null;
  if (unlockedOn && unlockedOn <= today) {
    for (const end of rangeKeys(unlockedOn, today)) {
      if (evaluate(rule, days, state, end, unlockedOn).every((p) => p.met)) {
        clearableOn = end;
        break;
      }
    }
  }
  return { level: rule.level, unlockedOn, current, clearableOn };
}

/**
 * Find bosses that are now beaten but not yet stored as cleared. Clearing one
 * level can unlock the next, so this repeats until nothing changes.
 * Returns updated states for the newly cleared levels only. Clears are never undone.
 */
export function detectClears(
  days: Days,
  states: LevelState[],
  today: DateKey,
  rules: LevelRule[] = LEVELS,
): LevelState[] {
  let work = rules.map((r) => stateFor(states, r.level));
  const changed = new Map<number, LevelState>();
  let progress = true;
  while (progress) {
    progress = false;
    for (const rule of rules) {
      const s = work.find((x) => x.level === rule.level)!;
      if (s.boss_cleared) continue;
      const p = bossProgress(rule, days, work, today, rules);
      if (p.clearableOn) {
        const next = { ...s, boss_cleared: true, cleared_on: p.clearableOn, celebrated: false };
        work = work.map((x) => (x.level === rule.level ? next : x));
        changed.set(rule.level, next);
        progress = true;
      }
    }
  }
  return [...changed.values()];
}
