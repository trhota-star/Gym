/** Fraction (0..1) for a progress ring. Never NaN, never above 100%, never below 0. */
export function ringProgress(done, target) {
  const d = Number(done);
  const t = Number(target);
  if (!Number.isFinite(d) || !Number.isFinite(t) || t <= 0 || d <= 0) return 0;
  return Math.min(d / t, 1);
}

/** Whole-number percentage for the label inside a ring (0..100). */
export const ringPercent = (done, target) => Math.round(ringProgress(done, target) * 100);
