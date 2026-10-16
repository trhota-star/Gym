import { describe, expect, it } from 'vitest';
import { streaks } from '../../lib/progress.js';
import { addDays, clientDate, weekStart, weekdayShort } from '../../lib/http.js';
import { ringPercent, ringProgress } from '../../src/lib/progress.js';

const TODAY = '2026-03-04'; // Wednesday
const days = (...ago) => ago.map((n) => ({ day: addDays(TODAY, -n) })); // most recent first, like the DB query

describe('streaks() with fake dates', () => {
  it('no workouts → 0', () => expect(streaks([], TODAY)).toEqual({ current: 0, best: 0 }));
  it('3 days in a row ending today → 3', () => expect(streaks(days(0, 1, 2), TODAY)).toEqual({ current: 3, best: 3 }));
  it('a workout today plus yesterday → 2', () => expect(streaks(days(0, 1), TODAY).current).toBe(2));
  it('yesterday only (not trained yet today) → still 1', () => expect(streaks(days(1), TODAY).current).toBe(1));
  it('a missed day resets the current streak but keeps the best', () =>
    expect(streaks(days(0, 1, 3, 4, 5, 6), TODAY)).toEqual({ current: 2, best: 4 }));
  it('last workout 2 days ago → 0', () => expect(streaks(days(2, 3), TODAY)).toEqual({ current: 0, best: 2 }));
  it('crosses month and year boundaries', () => {
    expect(streaks([{ day: '2026-01-01' }, { day: '2025-12-31' }, { day: '2025-12-30' }], '2026-01-01').current).toBe(3);
    expect(streaks([{ day: '2026-03-01' }, { day: '2026-02-28' }], '2026-03-01').current).toBe(2);
  });
  it('handles a leap day', () =>
    expect(streaks([{ day: '2028-03-01' }, { day: '2028-02-29' }, { day: '2028-02-28' }], '2028-03-01').current).toBe(3));
});

describe('date helpers', () => {
  it('weekStart is Monday, including on Sunday and Monday', () => {
    expect(weekStart('2026-03-04')).toBe('2026-03-02'); // Wed
    expect(weekStart('2026-03-08')).toBe('2026-03-02'); // Sun
    expect(weekStart('2026-03-02')).toBe('2026-03-02'); // Mon
  });
  it('addDays and weekdayShort', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(weekdayShort('2026-03-04')).toBe('Wed');
  });
  it('clientDate trusts only a valid YYYY-MM-DD date', () => {
    expect(clientDate({ query: { date: '2026-03-04' } })).toBe('2026-03-04');
    for (const bad of ['2026-13-45', 'yesterday', "2026-03-04'; DROP TABLE users;--", '']) {
      expect(clientDate({ query: { date: bad } })).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(clientDate({ query: { date: bad } })).not.toBe(bad);
    }
  });
});

describe('progress rings', () => {
  it.each([
    [0, 5, 0],
    [2, 4, 0.5],
    [5, 5, 1],
    [9, 5, 1], // over the goal: capped at 100%
    [300, 150, 1],
  ])('ringProgress(%s, %s) = %s', (done, target, expected) => expect(ringProgress(done, target)).toBe(expected));

  it.each([
    [0, 0],
    [5, 0],
    [undefined, 5],
    [5, undefined],
    [null, null],
    [NaN, 3],
    [-2, 4],
    ['abc', 4],
    [Infinity, 4],
  ])('never NaN or out of range for (%s, %s)', (done, target) => {
    const p = ringProgress(done, target);
    expect(Number.isNaN(p)).toBe(false);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('ringPercent is a whole number between 0 and 100', () => {
    expect(ringPercent(1, 3)).toBe(33);
    expect(ringPercent(10, 3)).toBe(100);
    expect(ringPercent(0, 0)).toBe(0);
  });
});
