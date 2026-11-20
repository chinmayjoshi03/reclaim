/**
 * ALL game rules live in this file. Change numbers or text here and the whole
 * app (scoring, levels, bosses, streaks, tests) follows.
 */

/** Boolean fields on a day log that can be ticked. */
export type QuestField =
  | 'phone_off_bed_afternoon'
  | 'phone_on_charger'
  | 'wind_down'
  | 'slept_without_porn'
  | 'afternoon_planned'
  | 'got_out_of_bed_when_awake';

export interface QuestRule {
  field: QuestField;
  /** Shown on the Today screen. `{plugIn}` is replaced with the plug-in time. */
  label: string;
  points: number;
}

/** Daily quests that score points (shown in this order on Today). */
export const DAILY_QUESTS: QuestRule[] = [
  { field: 'phone_off_bed_afternoon', label: 'Phone stayed off the bed all afternoon', points: 10 },
  { field: 'phone_on_charger', label: 'Phone on its charger by {plugIn}', points: 20 },
  { field: 'wind_down', label: 'Calm wind-down instead of scrolling', points: 10 },
  { field: 'slept_without_porn', label: 'Fell asleep without porn', points: 15 },
];

/** Tracked for boss fights only — no points. */
export const BOSS_TRACKERS: QuestRule[] = [
  { field: 'afternoon_planned', label: 'Afternoon was planned', points: 0 },
  { field: 'got_out_of_bed_when_awake', label: 'Got out of bed when I was awake', points: 0 },
];

export const LOG_FILLED_POINTS = 5;
export const URGE_BATTLE_POINTS = 10;
export const URGE_BATTLE_MAX_PER_DAY = 3;
export const COMEBACK_POINTS = 15;

/** Length of the urge timer. */
export const URGE_TIMER_MINUTES = 15;

/** How many days back (including today) can be edited. */
export const EDITABLE_DAYS = 7;

/**
 * A "day" runs until this hour the next morning. At 01:30 you are still in
 * last night, so the app treats "today" as the previous calendar date.
 */
export const DAY_ROLLOVER_HOUR = 4;

/** Boss fights look at any rolling window of this many days … */
export const BOSS_WINDOW_DAYS = 7;
/** … and need this many hits in it. */
export const BOSS_REQUIRED_HITS = 5;

export type BossRequirement =
  | {
      kind: 'count';
      field: QuestField;
      label: string;
      unit: 'nights' | 'days';
      /** Optional manual override stored on level_state (e.g. "confirmed manually"). */
      manualOverride?: ManualField;
      manualLabel?: string;
    }
  | { kind: 'manual'; field: ManualField; label: string };

export type ManualField = 'blocker_on' | 'passcode_held_by_someone_else' | 'out_of_bed_confirmed';

export interface LevelRule {
  level: number;
  name: string;
  /** Total points needed before this boss unlocks. */
  points: number;
  bossTitle: string;
  boss: BossRequirement[];
  defaultReward: string;
}

export const LEVELS: LevelRule[] = [
  {
    level: 1,
    name: 'Bed Guard',
    points: 250,
    bossTitle: 'Phone on the charger, 5 of 7 nights',
    boss: [{ kind: 'count', field: 'phone_on_charger', label: 'Phone on charger', unit: 'nights' }],
    defaultReward: 'Favourite meal',
  },
  {
    level: 2,
    name: 'Firewall',
    points: 600,
    bossTitle: 'Blocker on, passcode with someone else, afternoons planned',
    boss: [
      { kind: 'manual', field: 'blocker_on', label: 'Blocker is on' },
      { kind: 'manual', field: 'passcode_held_by_someone_else', label: 'Someone else holds the passcode' },
      { kind: 'count', field: 'afternoon_planned', label: 'Afternoon planned', unit: 'days' },
    ],
    defaultReward: 'Movie or outing with a friend',
  },
  {
    level: 3,
    name: 'Sleep Walker',
    points: 1000,
    bossTitle: 'Wind-down and getting up when awake',
    boss: [
      { kind: 'count', field: 'wind_down', label: 'Wind-down', unit: 'nights' },
      {
        kind: 'count',
        field: 'got_out_of_bed_when_awake',
        label: 'Got out of bed when awake',
        unit: 'nights',
        manualOverride: 'out_of_bed_confirmed',
        manualLabel: 'I confirm I do this now',
      },
    ],
    defaultReward: 'A good book or a speaker',
  },
  {
    level: 4,
    name: 'Night Owner',
    points: 1500,
    bossTitle: 'Slept without porn, 5 of 7 nights',
    boss: [{ kind: 'count', field: 'slept_without_porn', label: 'Slept without porn', unit: 'nights' }],
    defaultReward: 'Something bigger you’ve been wanting',
  },
];

/** Default settings for a fresh install. */
export const DEFAULT_TIMES = {
  plugIn: '22:30',
  riskyAfternoon: '15:00',
  deskLog: '10:00',
  /** If yesterday is still empty at this time, one follow-up reminder. */
  followUp: '18:00',
};

/** Notification offsets (minutes before the related setting time). */
export const NOTIFY_OFFSETS = {
  afternoonBefore: 15,
  windDownBefore: 30,
};

export const MAX_NOTIFICATIONS_PER_DAY = 5;
