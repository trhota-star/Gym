import { db } from '../lib/db.js';
import { route } from '../lib/http.js';

// Public numbers for the landing page hero
export default route({
  async GET() {
    const [row] = await db()`
      SELECT
        (SELECT COUNT(*) FROM users)::int AS members,
        (SELECT COUNT(*) FROM workouts WHERE status = 'completed')::int AS workouts_completed,
        (SELECT COUNT(*) FROM classes
          WHERE start_time >= date_trunc('week', now())
            AND start_time <  date_trunc('week', now()) + interval '7 days')::int AS classes_this_week`;
    return {
      members: row.members,
      workoutsCompleted: row.workouts_completed,
      classesThisWeek: row.classes_this_week,
    };
  },
});
