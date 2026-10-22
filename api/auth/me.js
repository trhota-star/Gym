import { db } from '../../lib/db.js';
import { clientDate, route } from '../../lib/http.js';
import { endSession, publicUser, sessionUserId } from '../../lib/auth.js';
import { activeDays, streaks } from '../../lib/progress.js';

// 200 with the user when logged in, 200 with `user: null` when not. Being logged out is a
// normal answer here, not an error, so a visitor's browser console stays free of 401s.
export default route({
  async GET(req, res) {
    const userId = await sessionUserId(req);
    if (!userId) {
      if (req.headers.cookie?.includes('pf_session=')) endSession(res); // expired or tampered token
      return { user: null };
    }

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
