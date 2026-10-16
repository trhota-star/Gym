import bcrypt from 'bcryptjs';
import { db } from '../../lib/db.js';
import { HttpError, body, clientDate, route } from '../../lib/http.js';
import { publicUser, startSession } from '../../lib/auth.js';
import { activeDays, streaks } from '../../lib/progress.js';

// Compared against when the email doesn't exist, so both failures take the same time
const DUMMY_HASH = bcrypt.hashSync('pulsefit-timing-guard', 10);

export default route({
  async POST(req, res) {
    const b = body(req);
    const email = String(b.email ?? '').trim().toLowerCase();
    const password = String(b.password ?? '');
    if (!email || !password) throw new HttpError(400, 'Please enter your email and password.');

    const sql = db();
    const [user] = await sql`
      SELECT id, email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes
      FROM users WHERE email = ${email}`;
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'That email and password don’t match. Please try again.');

    await startSession(res, user.id);
    const today = clientDate(req);
    const { current } = streaks(await activeDays(sql, user.id, today), today);
    return { user: { ...publicUser(user), streak: current } };
  },
});
