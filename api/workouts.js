import { db } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { HttpError, body, clientDate, route, toInt } from '../lib/http.js';
import { latestWorkoutRow, nameFor, renameFromGroups, todaysWorkout } from '../lib/workouts.js';
import { activeDays, streaks } from '../lib/progress.js';

const positiveId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export default route({
  // Today's workout with its exercises and sets (or null)
  async GET(req) {
    const userId = await requireUser(req);
    return { workout: await todaysWorkout(db(), userId, clientDate(req)) };
  },

  // Add an exercise to today's workout, creating the workout if needed
  async POST(req, res) {
    const userId = await requireUser(req);
    const date = clientDate(req);
    const exerciseId = positiveId(body(req).exerciseId);
    if (!exerciseId) throw new HttpError(400, 'Which exercise should we add?');

    const sql = db();
    const [exercise] = await sql`SELECT id FROM exercises WHERE id = ${exerciseId}`;
    if (!exercise) throw new HttpError(404, 'That exercise no longer exists.');

    let workout = await latestWorkoutRow(sql, userId, date);
    if (!workout || workout.status === 'completed') {
      [workout] = await sql`
        INSERT INTO workouts (user_id, name, workout_date, status)
        VALUES (${userId}, ${nameFor([])}, ${date}, 'planned')
        RETURNING id`;
    }

    // Adds the exercise once (re-adding is a no-op) together with one row per set
    await sql`
      WITH we AS (
        INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
        SELECT ${workout.id}, ${exerciseId}, COALESCE(MAX(order_index) + 1, 0)
        FROM workout_exercises WHERE workout_id = ${workout.id}
        ON CONFLICT (workout_id, exercise_id) DO NOTHING
        RETURNING id, exercise_id
      )
      INSERT INTO workout_sets (workout_exercise_id, set_number)
      SELECT we.id, gs
      FROM we JOIN exercises e ON e.id = we.exercise_id
      CROSS JOIN LATERAL generate_series(1, e.sets) AS gs`;
    await renameFromGroups(sql, workout.id);

    res.status(201);
    return { workout: await todaysWorkout(sql, userId, date) };
  },

  // Remove an exercise from today's (unfinished) workout
  async DELETE(req) {
    const userId = await requireUser(req);
    const date = clientDate(req);
    const exerciseId = positiveId(req.query?.exerciseId ?? body(req).exerciseId);
    if (!exerciseId) throw new HttpError(400, 'Which exercise should we remove?');

    const sql = db();
    const workout = await latestWorkoutRow(sql, userId, date);
    if (!workout) throw new HttpError(404, 'There’s no workout planned for today.');
    if (workout.status === 'completed') throw new HttpError(409, 'Today’s workout is already finished.');

    await sql`DELETE FROM workout_exercises WHERE workout_id = ${workout.id} AND exercise_id = ${exerciseId}`;
    await renameFromGroups(sql, workout.id);
    return { workout: await todaysWorkout(sql, userId, date) };
  },

  // start | finish | reset today's workout
  async PATCH(req) {
    const userId = await requireUser(req);
    const date = clientDate(req);
    const b = body(req);
    const workoutId = positiveId(b.workoutId);
    if (!workoutId) throw new HttpError(400, 'Which workout?');

    const sql = db();
    const [owned] = await sql`SELECT id, status FROM workouts WHERE id = ${workoutId} AND user_id = ${userId}`;
    if (!owned) throw new HttpError(404, 'Workout not found.');

    switch (b.action) {
      case 'start':
        await sql`
          UPDATE workouts SET status = 'in_progress', started_at = COALESCE(started_at, now())
          WHERE id = ${workoutId} AND status = 'planned'`;
        return { workout: await todaysWorkout(sql, userId, date) };

      case 'finish': {
        const minutes = toInt(b.durationMinutes, { min: 1, max: 600, fallback: null });
        await sql`
          UPDATE workouts
          SET status = 'completed',
              completed_at = now(),
              started_at = COALESCE(started_at, now()),
              duration_minutes = COALESCE(
                ${minutes}::int,
                GREATEST(1, ROUND(EXTRACT(EPOCH FROM now() - COALESCE(started_at, now())) / 60))::int
              )
          WHERE id = ${workoutId} AND status <> 'completed'`;
        const streak = streaks(await activeDays(sql, userId, date), date).current;
        return { workout: await todaysWorkout(sql, userId, date), streak };
      }

      case 'reset':
        if (owned.status === 'completed') {
          // Keep the finished workout in your history and start a fresh copy of it
          await sql`
            WITH nw AS (
              INSERT INTO workouts (user_id, name, workout_date, status, started_at)
              SELECT user_id, name, ${date}, 'in_progress', now() FROM workouts WHERE id = ${workoutId}
              RETURNING id
            ), nwe AS (
              INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
              SELECT nw.id, we.exercise_id, we.order_index FROM nw, workout_exercises we WHERE we.workout_id = ${workoutId}
              RETURNING id, exercise_id
            )
            INSERT INTO workout_sets (workout_exercise_id, set_number)
            SELECT nwe.id, gs FROM nwe JOIN exercises e ON e.id = nwe.exercise_id
            CROSS JOIN LATERAL generate_series(1, e.sets) AS gs`;
        } else {
          await sql`
            UPDATE workout_sets s SET completed = false, completed_at = NULL
            FROM workout_exercises we WHERE we.id = s.workout_exercise_id AND we.workout_id = ${workoutId}`;
          await sql`UPDATE workouts SET status = 'in_progress', started_at = now() WHERE id = ${workoutId}`;
        }
        return { workout: await todaysWorkout(sql, userId, date) };

      default:
        throw new HttpError(400, 'Unknown action. Use start, finish or reset.');
    }
  },
});
