import { NOTIFICATIONS, type NotifyType } from '../config/messages';
import { DEFAULT_TIMES, MAX_NOTIFICATIONS_PER_DAY, NOTIFY_OFFSETS } from '../config/rules';
import { addDays, diffDays, hmToMinutes, minutesToHm, toKey } from '../logic/dates';
import type { DateKey, DayLog } from '../logic/types';
import type { Settings } from '../db/settings';

export interface PlannedNotification {
  id: string;
  type: NotifyType;
  title: string;
  body: string;
  /** Route opened when the notification is tapped. */
  url: string;
  /** Daily repeating at hh:mm, or a one-off at `date`. */
  trigger: { kind: 'daily'; hour: number; minute: number } | { kind: 'once'; date: Date };
}

const URLS: Record<NotifyType, string> = {
  dailyLog: '/?day=yesterday',
  followUp: '/?day=yesterday',
  afternoon: '/',
  windDown: '/',
  plugIn: '/night',
};

/** Stable "random": rotate through variants by calendar day, offset per type. */
export function pickVariant(type: NotifyType, day: DateKey): string {
  const list = NOTIFICATIONS[type].bodies;
  const offset = ['dailyLog', 'followUp', 'afternoon', 'windDown', 'plugIn'].indexOf(type) * 3;
  const n = diffDays('2026-01-01', day) + offset;
  return list[((n % list.length) + list.length) % list.length];
}

/** Times of the four daily reminders, from settings. */
export function reminderTimes(s: Settings): Record<Exclude<NotifyType, 'followUp'>, string> {
  return {
    dailyLog: s.deskLogTime,
    afternoon: minutesToHm(hmToMinutes(s.riskyAfternoonTime) - NOTIFY_OFFSETS.afternoonBefore),
    windDown: minutesToHm(hmToMinutes(s.plugInTime) - NOTIFY_OFFSETS.windDownBefore),
    plugIn: s.plugInTime,
  };
}

/** Local Date for a calendar key at hh:mm. */
function at(key: DateKey, hm: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  const mins = hmToMinutes(hm);
  return new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0, 0);
}

/**
 * The single follow-up: the next follow-up time at which "yesterday" (relative
 * to that moment's calendar date) is still unlogged. Null if none is needed.
 */
export function nextFollowUp(days: Record<DateKey, DayLog>, now: Date, followUp = DEFAULT_TIMES.followUp): Date | null {
  const today = toKey(now);
  for (const key of [today, addDays(today, 1)]) {
    const when = at(key, followUp);
    if (when <= now) continue;
    const yesterday = addDays(key, -1);
    if (!days[yesterday]?.log_filled) return when;
  }
  return null;
}

/** Everything that should be scheduled right now. Pure, so it is unit-tested. */
export function planNotifications(s: Settings, days: Record<DateKey, DayLog>, now: Date): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const times = reminderTimes(s);
  const today = toKey(now);

  (Object.keys(times) as (keyof typeof times)[]).forEach((type) => {
    if (!s.notify[type]) return;
    const mins = hmToMinutes(times[type]);
    // The text shown is the variant for the day it will next fire.
    const nextDay = hmToMinutes(`${now.getHours()}:${now.getMinutes()}`) < mins ? today : addDays(today, 1);
    out.push({
      id: `reclaim-${type}`,
      type,
      title: NOTIFICATIONS[type].title,
      body: pickVariant(type, nextDay),
      url: URLS[type],
      trigger: { kind: 'daily', hour: Math.floor(mins / 60), minute: mins % 60 },
    });
  });

  if (s.notify.followUp) {
    const when = nextFollowUp(days, now);
    if (when) {
      out.push({
        id: 'reclaim-followUp',
        type: 'followUp',
        title: NOTIFICATIONS.followUp.title,
        body: pickVariant('followUp', toKey(when)),
        url: URLS.followUp,
        trigger: { kind: 'once', date: when },
      });
    }
  }

  return out.slice(0, MAX_NOTIFICATIONS_PER_DAY);
}
