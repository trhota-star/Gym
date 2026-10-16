import bcrypt from 'bcryptjs';
import { db } from '../../lib/db.js';
import { HttpError, body, route, toInt } from '../../lib/http.js';
import { publicUser, startSession } from '../../lib/auth.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default route({
  async POST(req, res) {
    const b = body(req);
    const fullName = String(b.fullName ?? '').trim();
    const email = String(b.email ?? '').trim().toLowerCase();
    const password = String(b.password ?? '');

    if (fullName.length < 2 || fullName.length > 80) throw new HttpError(400, 'Please enter your name.');
    if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, 'Please enter a valid email address.');
    if (!password) throw new HttpError(400, 'Please choose a password.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new HttpError(400, 'Use at least 8 characters, including a letter and a number.');
    }
    if (password.length > 72) throw new HttpError(400, 'Your password can be at most 72 characters.');

    const goalWorkouts = toInt(b.weeklyGoalWorkouts, { min: 1, max: 14, fallback: 4 });
    const goalMinutes = toInt(b.weeklyGoalMinutes, { min: 10, max: 3000, fallback: 150 });
    const hash = await bcrypt.hash(password, 10);

    const sql = db();
    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
      VALUES (${email}, ${hash}, ${fullName}, ${goalWorkouts}, ${goalMinutes})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, full_name, weekly_goal_workouts, weekly_goal_minutes`;
    if (!user) throw new HttpError(409, 'An account with this email already exists. Try logging in instead.');

    await startSession(res, user.id);
    res.status(201);
    return { user: { ...publicUser(user), streak: 0 } };
  },
});
