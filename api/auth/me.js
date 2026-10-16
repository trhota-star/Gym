import { db } from '../../lib/db.js';
import { HttpError, clientDate, route } from '../../lib/http.js';
import { endSession, publicUser, requireUser } from '../../lib/auth.js';
import { activeDays, streaks } from '../../lib/progress.js';

// 200 with the user when logged in, 401 when not (the app treats 401 as "logged out")
export default route({
  async GET(req, res) {
    const userId = await requireUser(req);

    const sql = db();
    const today = clientDate(req);
    const [[user], days] = await Promise.all([
      sql`SELECT id, email, full_name, weekly_goal_workouts, weekly_goal_minutes FROM users WHERE id = ${userId}`,
      activeDays(sql, userId, today),
    ]);
    if (!user) {
      endSession(res); // account was deleted
      throw new HttpError(401, 'Please log in to continue.');
    }
    return { user: { ...publicUser(user), streak: streaks(days, today).current } };
  },
});
