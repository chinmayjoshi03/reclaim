import { addDays, logicalDayKey } from '../logic/dates';
import { emptyDay, type DayLog } from '../logic/types';
import * as repo from './repo';

/** Small deterministic PRNG so the seed looks the same every time. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const NOTES = ['Bored after dinner', 'Stressed about exams', 'Lonely, late scroll', 'Tired, in bed early', ''];

/**
 * 30 days of fake logs ending yesterday, improving over time so the charts
 * show a trend. Includes clean runs, comebacks, a plain slip and a few blank days.
 */
export function generateSeed(today: string, count = 30): DayLog[] {
  const r = rng(42);
  const out: DayLog[] = [];
  for (let i = count; i >= 1; i--) {
    const date = addDays(today, -i);
    const progress = 1 - i / count; // 0 → 1 over the month
    const roll = r();
    if (roll < 0.08) continue; // a few days never logged
    const good = (p: number) => r() < p + progress * 0.35;
    const slipped = r() > 0.55 + progress * 0.35;
    const episodes = slipped ? 1 + Math.floor(r() * 2) : 0;
    out.push({
      ...emptyDay(date),
      phone_off_bed_afternoon: good(0.45),
      phone_on_charger: good(0.5),
      wind_down: good(0.4),
      slept_without_porn: !slipped,
      log_filled: true,
      urge_battles: r() < 0.4 ? 1 + Math.floor(r() * 3) : 0,
      comeback: slipped && r() < 0.7,
      afternoon_planned: good(0.4),
      got_out_of_bed_when_awake: good(0.3),
      episodes,
      sleep_quality: 1 + Math.min(4, Math.floor(r() * 3 + progress * 2.5)),
      note: slipped ? NOTES[Math.floor(r() * NOTES.length)] : '',
      updated_at: new Date().toISOString(),
    });
  }
  return out;
}

/** Replace all day logs with the seed and move the plan start back 30 days. */
export async function seedDatabase(count = 30): Promise<void> {
  const today = logicalDayKey();
  await repo.wipeAll();
  for (const d of generateSeed(today, count)) await repo.upsertDay(d);
  const settings = await repo.getSettings();
  await repo.saveSettings({ ...settings, startDate: addDays(today, -count) });
}
