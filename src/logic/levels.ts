import { LEVELS, type LevelRule } from '../config/rules';
import { emptyLevelState, type LevelState } from './types';

export type LevelStatus = 'locked' | 'in_progress' | 'boss_ready' | 'cleared';

export interface LevelView {
  rule: LevelRule;
  state: LevelState;
  status: LevelStatus;
  /** Points still needed to reach this level's threshold (0 once reached). */
  pointsToGo: number;
}

/**
 * Status of every level from total points + stored boss results.
 * - cleared:     boss beaten (stored, never undone)
 * - boss_ready:  previous level cleared and points threshold reached
 * - in_progress: previous level cleared, still collecting points
 * - locked:      previous level not cleared yet
 */
export function levelViews(total: number, states: LevelState[], rules: LevelRule[] = LEVELS): LevelView[] {
  const byLevel = new Map(states.map((s) => [s.level, s]));
  let prevCleared = true;
  return rules.map((rule) => {
    const state = byLevel.get(rule.level) ?? emptyLevelState(rule.level);
    const pointsToGo = Math.max(0, rule.points - total);
    let status: LevelStatus;
    if (state.boss_cleared) status = 'cleared';
    else if (!prevCleared) status = 'locked';
    else if (pointsToGo === 0) status = 'boss_ready';
    else status = 'in_progress';
    prevCleared = status === 'cleared';
    return { rule, state, status, pointsToGo };
  });
}

/** The level being worked on now (first not cleared), or null when all are cleared. */
export function currentLevel(views: LevelView[]): LevelView | null {
  return views.find((v) => v.status !== 'cleared') ?? null;
}

/** One-line header text for the Today screen. */
export function levelHeadline(views: LevelView[]): { title: string; subtitle: string } {
  const cur = currentLevel(views);
  if (!cur) {
    const last = views[views.length - 1];
    return { title: `Level ${last.rule.level} · ${last.rule.name}`, subtitle: 'All levels cleared. Keep the plan.' };
  }
  const title = `Level ${cur.rule.level} · ${cur.rule.name}`;
  if (cur.status === 'boss_ready') return { title, subtitle: 'Beat the boss' };
  return { title, subtitle: `${cur.pointsToGo} points to the boss` };
}
