import { addDays } from './http.js';

/** Completed-workout totals per day (most recent first), up to and including `today`. */
export function activeDays(sql, userId, today) {
  return sql`
    SELECT w.workout_date::text AS day,
           COUNT(*)::int AS workouts,
           COALESCE(SUM(w.duration_minutes), 0)::int AS minutes,
           COALESCE(SUM(k.calories), 0)::int AS calories
    FROM workouts w
    LEFT JOIN LATERAL (
      SELECT SUM(e.calories) AS calories
      FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
      WHERE we.workout_id = w.id
    ) k ON true
    WHERE w.user_id = ${userId} AND w.status = 'completed' AND w.workout_date <= ${today}
    GROUP BY w.workout_date
    ORDER BY w.workout_date DESC
    LIMIT 400`;
}

/**
 * current: consecutive days with a completed workout, ending today (or yesterday, so the
 * streak doesn't read 0 in the morning before you've trained). best: the longest run ever.
 */
export function streaks(days, today) {
  const set = new Set(days.map((d) => d.day));
  let current = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev = null;
  for (const { day } of [...days].reverse()) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current, best };
}
