// Workout queries shared by /api/workouts, /api/sets and /api/dashboard.
// Every function takes the logged-in userId, so one user can never see another's data.

const SECONDS_PER_SET = 45;

export async function latestWorkoutRow(sql, userId, date) {
  const [row] = await sql`
    SELECT id, name, workout_date::text AS workout_date, status, duration_minutes, started_at, completed_at
    FROM workouts
    WHERE user_id = ${userId} AND workout_date = ${date}
    ORDER BY id DESC
    LIMIT 1`;
  return row ?? null;
}

async function workoutExercises(sql, workoutId) {
  return sql`
    SELECT we.id AS workout_exercise_id, e.id AS exercise_id, e.name, e.muscle_group, e.reps, e.difficulty,
           e.rest_seconds, e.equipment, e.calories,
           COALESCE(
             json_agg(json_build_object('id', s.id, 'setNumber', s.set_number, 'completed', s.completed)
                      ORDER BY s.set_number) FILTER (WHERE s.id IS NOT NULL),
             '[]'
           ) AS sets
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
    WHERE we.workout_id = ${workoutId}
    GROUP BY we.id, e.id
    ORDER BY we.order_index, we.id`;
}

function shape(row, exercises) {
  const list = exercises.map((e) => ({
    workoutExerciseId: e.workout_exercise_id,
    exerciseId: e.exercise_id,
    name: e.name,
    muscleGroup: e.muscle_group,
    reps: e.reps,
    difficulty: e.difficulty,
    restSeconds: e.rest_seconds,
    equipment: e.equipment,
    calories: e.calories,
    sets: e.sets,
  }));
  const muscleGroups = [...new Set(list.map((e) => e.muscleGroup))];
  const totalSets = list.reduce((n, e) => n + e.sets.length, 0);
  const estimatedSeconds = list.reduce((n, e) => n + e.sets.length * (SECONDS_PER_SET + e.restSeconds), 0);
  return {
    id: row.id,
    name: row.name,
    date: row.workout_date,
    status: row.status,
    durationMinutes: row.duration_minutes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    muscleGroups,
    totalSets,
    completedSets: list.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0),
    estimatedMinutes: Math.max(5, Math.round(estimatedSeconds / 60)),
    calories: list.reduce((n, e) => n + e.calories, 0),
    exercises: list,
  };
}

/** Today's workout for this user (the most recent one dated today), fully loaded, or null. */
export async function todaysWorkout(sql, userId, date) {
  const row = await latestWorkoutRow(sql, userId, date);
  if (!row) return null;
  return shape(row, await workoutExercises(sql, row.id));
}

export function nameFor(groups) {
  if (groups.length === 0) return 'Today’s Workout';
  if (groups.length <= 2) return `${groups.join(' & ')} Day`;
  return 'Full Body Mix';
}

/** Keep the workout's name in sync with the muscle groups it contains. */
export async function renameFromGroups(sql, workoutId) {
  const rows = await sql`
    SELECT e.muscle_group
    FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
    WHERE we.workout_id = ${workoutId}
    GROUP BY e.muscle_group
    ORDER BY MIN(we.order_index)`;
  await sql`UPDATE workouts SET name = ${nameFor(rows.map((r) => r.muscle_group))} WHERE id = ${workoutId}`;
}
