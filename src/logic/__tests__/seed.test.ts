import { generateSeed } from '../../db/seed';
import { dayStatus } from '../streaks';

jest.mock('../../db/repo', () => ({}));

describe('seed', () => {
  const seed = generateSeed('2026-11-20');
  it('covers the 30 days before today, with some gaps', () => {
    expect(seed.length).toBeGreaterThan(20);
    expect(seed.length).toBeLessThanOrEqual(30);
    expect(seed[0].date >= '2026-10-21').toBe(true);
    expect(seed[seed.length - 1].date <= '2026-11-19').toBe(true);
  });
  it('includes every calendar state', () => {
    const states = new Set(seed.map((d) => dayStatus(d)));
    expect(states).toEqual(new Set(['completed', 'comeback', 'not_completed']));
  });
  it('is deterministic', () => {
    expect(generateSeed('2026-11-20')).toEqual(
      seed.map((d) => ({ ...d, updated_at: expect.any(String) })),
    );
  });
});
