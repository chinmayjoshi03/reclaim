import { DAY_ROLLOVER_HOUR } from '../config/rules';
import type { DateKey } from './types';

/**
 * All day keys are local-time YYYY-MM-DD strings. Arithmetic on keys is done
 * in UTC on the key's own Y/M/D so it never shifts across a timezone or DST.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: DateKey): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

/** Local Date at 00:00 on the key's day. */
export function keyToLocalDate(key: DateKey): Date {
  const { y, m, d } = parseKey(key);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const { y, m, d } = parseKey(key);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Whole days from a to b (b - a). */
export function diffDays(a: DateKey, b: DateKey): number {
  const pa = parseKey(a);
  const pb = parseKey(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86_400_000);
}

/** 0 = Sunday. */
export function weekday(key: DateKey): number {
  const { y, m, d } = parseKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * The "logical" day for a moment in time. Before DAY_ROLLOVER_HOUR the night
 * still belongs to the previous date (01:30 on the 5th → the 4th).
 */
export function logicalDayKey(now: Date = new Date(), rolloverHour = DAY_ROLLOVER_HOUR): DateKey {
  const key = toKey(now);
  return now.getHours() < rolloverHour ? addDays(key, -1) : key;
}

/** "HH:MM" → minutes since midnight. */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHm(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

/**
 * True between the plug-in time and the morning rollover (the night window).
 * Works when plug-in is before or after midnight.
 */
export function isNightWindow(now: Date, plugIn: string, rolloverHour = DAY_ROLLOVER_HOUR): boolean {
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = hmToMinutes(plugIn);
  const end = rolloverHour * 60;
  if (start > end) return mins >= start || mins < end;
  return mins >= start && mins < end;
}

/** Inclusive list of keys from a to b. */
export function rangeKeys(a: DateKey, b: DateKey): DateKey[] {
  const out: DateKey[] = [];
  const n = diffDays(a, b);
  for (let i = 0; i <= n; i++) out.push(addDays(a, i));
  return out;
}

export function monthKey(key: DateKey): string {
  return key.slice(0, 7);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export function monthTitle(y: number, m: number): string {
  return `${MONTHS[m - 1]} ${y}`;
}

/** "Fri 20 Nov" */
export function shortLabel(key: DateKey): string {
  const { m, d } = parseKey(key);
  return `${DAYS_SHORT[weekday(key)]} ${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "20 Nov" */
export function dayMonth(key: DateKey): string {
  const { m, d } = parseKey(key);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** 12-hour label for "HH:MM": "10:30 pm". */
export function prettyTime(hm: string): string {
  const total = hmToMinutes(hm);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
}
