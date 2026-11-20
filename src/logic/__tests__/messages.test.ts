import * as messages from '../../config/messages';
import { ALLOWED_PHRASES, BANNED_WORDS } from '../../config/messages';

/** Collect every string inside a value, recursively. */
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

describe('copy tone', () => {
  const { BANNED_WORDS: _b, ALLOWED_PHRASES: _a, ...copy } = messages;
  const all = strings(copy);

  it('has copy to check', () => {
    expect(all.length).toBeGreaterThan(10);
  });

  it.each(BANNED_WORDS)('never uses "%s"', (word) => {
    for (const s of all) {
      let lower = s.toLowerCase();
      for (const ok of ALLOWED_PHRASES) lower = lower.split(ok).join('');
      expect(lower).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});
