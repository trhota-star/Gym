import { db } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { HttpError, addDays, clientDate, route, weekStart, weekdayShort } from '../lib/http.js';
import { todaysWorkout } from '../lib/workouts.js';
import { activeDays, streaks } from '../lib/progress.js';

export default route({
  async GET(req) {
    const userId = await requireUser(req);
    const today = clientDate(req);
    const sql = db();

    const [[user], workout, days, [nextClass]] = await Promise.all([
      sql`SELECT full_name, weekly_goal_workouts, weekly_goal_minutes FROM users WHERE id = ${userId}`,
      todaysWorkout(sql, userId, today),
      activeDays(sql, userId, today),
      sql`SELECT id, title, coach_name, start_time, duration_minutes, capacity, intensity
          FROM classes WHERE start_time > now() ORDER BY start_time LIMIT 1`,
    ]);
    if (!user) throw new HttpError(401, 'Please log in to continue.');

    const byDay = new Map(days.map((d) => [d.day, d]));

    // Active minutes for each of the last 7 days, oldest first, today last
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i - 6);
      const d = byDay.get(date);
      return { date, day: weekdayShort(date), minutes: d?.minutes ?? 0, calories: d?.calories ?? 0 };
    });

    // Goal rings use the calendar week (Monday to today)
    const monday = weekStart(today);
    const thisWeek = days.filter((d) => d.day >= monday);
    const workoutsDone = thisWeek.reduce((n, d) => n + d.workouts, 0);
    const minutesDone = thisWeek.reduce((n, d) => n + d.minutes, 0);
    const goalsHit = Number(workoutsDone >= user.weekly_goal_workouts) + Number(minutesDone >= user.weekly_goal_minutes);

    return {
      today,
      firstName: user.full_name.split(/\s+/)[0],
      workout,
      weeklyActivity,
      streak: streaks(days, today),
      goals: {
        workouts: { done: workoutsDone, target: user.weekly_goal_workouts },
        minutes: { done: minutesDone, target: user.weekly_goal_minutes },
        goals: { done: goalsHit, target: 2 },
      },
      nextClass: nextClass
        ? {
            id: nextClass.id,
            title: nextClass.title,
            coach: nextClass.coach_name,
            startTime: nextClass.start_time,
            duration: nextClass.duration_minutes,
            capacity: nextClass.capacity,
            intensity: nextClass.intensity,
          }
        : null,
    };
  },
});
