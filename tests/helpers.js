import request from 'supertest';
import { createApp } from '../server/app.js';
import { db } from '../lib/db.js';

// Every test account uses this domain, so cleanup can never touch a real user
export const TEST_DOMAIN = '@pulsefit-test.dev';
export const PASSWORD = 'Test1234!';

let appPromise;
export const getApp = () => (appPromise ??= createApp().then((r) => r.app));

export const uniqueEmail = (tag = 'user') =>
  `vitest-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${TEST_DOMAIN}`;

/** A logged-in supertest agent (it keeps the session cookie between requests). */
export async function signedUpAgent(overrides = {}) {
  const agent = request.agent(await getApp());
  const email = overrides.email ?? uniqueEmail();
  const res = await agent.post('/api/auth/signup').send({
    fullName: 'Vitest Tester',
    email,
    password: PASSWORD,
    weeklyGoalWorkouts: 3,
    weeklyGoalMinutes: 60,
    ...overrides,
  });
  if (res.status !== 201) throw new Error(`Test sign-up failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, email, user: res.body.user };
}

export async function exerciseIds() {
  const rows = await db()`SELECT id, name, muscle_group, sets FROM exercises ORDER BY id`;
  return Object.fromEntries(rows.map((r) => [r.name, r]));
}

/** Plan, start, tick every set and finish a workout dated `date` (YYYY-MM-DD). */
export async function completeWorkoutOn(agent, date, exerciseId, minutes = 30) {
  const added = await agent.post(`/api/workouts?date=${date}`).send({ exerciseId });
  if (added.status !== 201) throw new Error(`add failed: ${added.status} ${JSON.stringify(added.body)}`);
  const workout = added.body.workout;
  await agent.patch(`/api/workouts?date=${date}`).send({ workoutId: workout.id, action: 'start' });
  for (const set of workout.exercises.flatMap((e) => e.sets)) {
    await agent.patch('/api/sets').send({ setId: set.id, completed: true });
  }
  const done = await agent.patch(`/api/workouts?date=${date}`).send({ workoutId: workout.id, action: 'finish', durationMinutes: minutes });
  if (done.status !== 200) throw new Error(`finish failed: ${done.status} ${JSON.stringify(done.body)}`);
  return done.body;
}

export const isoDaysAgo = (base, n) => {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

export async function cleanupTestUsers() {
  await db()`DELETE FROM users WHERE email LIKE ${`%${TEST_DOMAIN}`}`;
}
