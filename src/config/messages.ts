/**
 * All coaching copy in one place. Tone: firm, short, direct, on your side.
 * A test (messages.test.ts) checks every string here for banned words.
 */

export const BANNED_WORDS = ['pathetic', 'failure', 'failed', 'weak', 'loser', 'disgusting', 'shame', 'worthless'];

/** Phrases that are allowed even though they contain a banned word (e.g. "not failure"). */
export const ALLOWED_PHRASES = ['not failure'];

export interface UrgeStep {
  /** Minute of the timer at which this step becomes the current one. */
  atMinute: number;
  title: string;
  detail: string;
}

export const URGE_STEPS: UrgeStep[] = [
  { atMinute: 0, title: 'Name it', detail: 'This is an urge. It will rise and fall.' },
  { atMinute: 1, title: 'Stand up', detail: 'Stand up and leave the bed.' },
  { atMinute: 3, title: 'Move', detail: 'Do something physical: push-ups, cold water, a walk.' },
  {
    atMinute: 10,
    title: 'Ask',
    detail: 'What do you actually need — sleep, stress relief, company, something to do?',
  },
];

export const URGE_COPY = {
  started: 'Timer started. +10 already earned.',
  startedNoPoints: 'Timer started. Today’s 3 battles are already counted — this one still counts for you.',
  endTitle: 'How did it go?',
  endSubtitle: 'Any answer is fine. You showed up.',
  outcomes: {
    passed: { label: 'It passed', reply: 'That’s the win. Lights low, phone on the charger, back to sleep.' },
    still: {
      label: 'Still there, but I’m OK',
      reply: 'You still got up and fought it. Water, lights low, try to sleep. Start again if you need to.',
    },
    slipped: { label: 'I slipped', reply: '' },
  },
};

export const SLIP_COPY = {
  title: 'Back to the plan',
  intro: 'Write down what happened. Two minutes. This is how the plan gets better.',
  fields: {
    time: { label: 'Time', placeholder: 'e.g. 23:40' },
    place: { label: 'Place', placeholder: 'e.g. in bed, desk, bathroom' },
    feeling: { label: 'Feeling', placeholder: 'e.g. bored, stressed, lonely, tired' },
    change: { label: 'One change for next time', placeholder: 'e.g. phone charges in the kitchen' },
  },
  needOne: 'Fill in at least one line to log the comeback.',
  saved: 'Slips are data, not failure. Back to the plan.',
  savedSub: 'Comeback logged. +15.',
  savedSubAgain: 'Comeback already counted today. The note is saved.',
};

/* ------------------------------------------------------------------ */
/* Notifications. Shown on the lock screen, so every line stays        */
/* neutral: no mention of what the plan is about (see LOCKSCREEN test). */
/* ------------------------------------------------------------------ */

export type NotifyType = 'dailyLog' | 'followUp' | 'afternoon' | 'windDown' | 'plugIn';

/** Words that must never appear in notification text. */
export const LOCKSCREEN_BANNED = ['porn', 'masturbat', 'addict', 'sex', 'relapse', 'fap', 'urge', 'slip', 'clean', 'episode'];

export const NOTIFICATIONS: Record<NotifyType, { title: string; bodies: string[] }> = {
  dailyLog: {
    title: 'Desk log',
    bodies: [
      'Log yesterday at your desk. Good day or not, it’s +5.',
      'Two minutes at the desk: log yesterday. +5 either way.',
      'Desk time. Yesterday’s log is waiting. +5.',
      'Quick one: log yesterday before the day gets going. +5.',
      'Sit at the desk, log yesterday. Honest beats perfect. +5.',
      'Yesterday, logged in two minutes. +5 for showing up.',
    ],
  },
  followUp: {
    title: 'Desk log',
    bodies: [
      'Yesterday is still empty. Two minutes. Do it now.',
      'Yesterday’s log is still blank. Two minutes, then move on.',
      'Still time to log yesterday. +5 is waiting.',
      'One thing left: log yesterday. Two minutes.',
      'Yesterday isn’t logged yet. Do it now, at a desk.',
    ],
  },
  afternoon: {
    title: 'Afternoon plan',
    bodies: [
      'Afternoon plan: where are you going to be? Phone stays off the bed.',
      'Pick a place for the afternoon that isn’t the bed. +10.',
      'Plan the afternoon now: library, desk, outside. Phone off the bed.',
      'Off the bed this afternoon. Choose the spot now. +10.',
      'Afternoon: get out, get busy. The bed is for night.',
    ],
  },
  windDown: {
    title: 'Wind-down',
    bodies: [
      'Wind-down starts now. Dim the lights. Charger soon.',
      '30 minutes to charger time. Lights low, screens down.',
      'Start winding down: shower, book, lights low.',
      'Wind-down time. Slow it down. Charger in 30.',
      'Lights down. Something calm. Charger soon. +10.',
      'Ease off the screen. Wind-down starts now.',
    ],
  },
  plugIn: {
    title: 'Charger',
    bodies: [
      'Charger. Now. +20 is waiting.',
      'Charger time. +20 is waiting.',
      'Phone on the charger, away from the bed. +20.',
      'Plug it in and walk away. +20.',
      'Charger time. You’ve got this. +20.',
      'Phone goes on the charger now. Sleep comes easier. +20.',
    ],
  },
};

export const NIGHT_COPY = {
  title: 'Charger time',
  body: 'It’s late. Phone on the charger, away from the bed.',
  startUrge: 'Start urge timer',
  quickLog: 'Log quickly and close',
  quickTitle: 'Quick log',
  quickSub: 'Tick what’s true. Then the phone goes down.',
  done: 'Done. Close the app',
};
