import { db } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { HttpError, body, route } from '../lib/http.js';

// Tick or untick one set. Only sets inside the logged-in user's unfinished workouts can change.
export default route({
  async PATCH(req) {
    const userId = await requireUser(req);
    const b = body(req);
    const setId = Number(b.setId);
    if (!Number.isInteger(setId) || setId < 1) throw new HttpError(400, 'Which set?');
    if (typeof b.completed !== 'boolean') throw new HttpError(400, '"completed" must be true or false.');

    const sql = db();
    const [set] = await sql`
      UPDATE workout_sets s
      SET completed = ${b.completed},
          completed_at = CASE WHEN ${b.completed}::boolean THEN now() ELSE NULL END
      FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE s.id = ${setId}
        AND s.workout_exercise_id = we.id
        AND w.user_id = ${userId}
        AND w.status <> 'completed'
      RETURNING s.id, s.set_number, s.completed, w.id AS workout_id`;

    if (!set) {
      const [exists] = await sql`
        SELECT w.status FROM workout_sets s
        JOIN workout_exercises we ON we.id = s.workout_exercise_id
        JOIN workouts w ON w.id = we.workout_id
        WHERE s.id = ${setId} AND w.user_id = ${userId}`;
      if (exists) throw new HttpError(409, 'This workout is already finished.');
      throw new HttpError(404, 'Set not found.');
    }

    // Ticking the first set counts as starting the workout
    await sql`
      UPDATE workouts SET status = 'in_progress', started_at = COALESCE(started_at, now())
      WHERE id = ${set.workout_id} AND status = 'planned'`;

    return { set: { id: set.id, setNumber: set.set_number, completed: set.completed } };
  },
});
