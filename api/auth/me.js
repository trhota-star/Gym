import { db } from '../../lib/db.js';
import { clientDate, route } from '../../lib/http.js';
import { endSession, publicUser, sessionUserId } from '../../lib/auth.js';
import { activeDays, streaks } from '../../lib/progress.js';

// Logged-out visitors get { user: null } (not a 401) so the public landing page stays quiet
export default route({
  async GET(req, res) {
    const userId = await sessionUserId(req);
    if (!userId) return { user: null };

    const sql = db();
    const today = clientDate(req);
    const [[user], days] = await Promise.all([
      sql`SELECT id, email, full_name, weekly_goal_workouts, weekly_goal_minutes FROM users WHERE id = ${userId}`,
      activeDays(sql, userId, today),
    ]);
    if (!user) {
      endSession(res); // account was deleted
      return { user: null };
    }
    return { user: { ...publicUser(user), streak: streaks(days, today).current } };
  },
});
