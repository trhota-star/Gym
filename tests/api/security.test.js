import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { db } from '../../lib/db.js';
import { cleanupTestUsers, completeWorkoutOn, exerciseIds, getApp, signedUpAgent } from '../helpers.js';

afterAll(cleanupTestUsers);

const DATE = '2025-08-20';
const q = `?date=${DATE}`;

describe('protected routes need a login', () => {
  it.each([
    ['GET', '/api/auth/me'],
    ['GET', '/api/dashboard'],
    ['GET', '/api/workouts'],
    ['POST', '/api/workouts'],
    ['DELETE', '/api/workouts?exerciseId=1'],
    ['PATCH', '/api/workouts'],
    ['PATCH', '/api/sets'],
  ])('%s %s → 401', async (method, path) => {
    const res = await request(await getApp())[method.toLowerCase()](path).send({ workoutId: 1, setId: 1, completed: true, exerciseId: 1 });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/log in/i);
  });
});

describe('user A cannot see or change user B’s data', () => {
  let a;
  let b;
  let aWorkout;
  beforeAll(async () => {
    const ex = await exerciseIds();
    a = await signedUpAgent({ fullName: 'Alice Tester' });
    b = await signedUpAgent({ fullName: 'Bob Tester' });
    aWorkout = (await a.agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Back Squat'].id })).body.workout;
    // Bob has his own finished workout from a different day
    await completeWorkoutOn(b.agent, '2025-08-19', ex['Hammer Curl'].id, 15);
  });

  const aSet = () => aWorkout.exercises[0].sets[0];

  it('B does not see A’s workout for the same day', async () => {
    const res = await b.agent.get(`/api/workouts${q}`);
    expect(res.body.workout).toBeNull();
  });

  it('B’s dashboard has none of A’s data, and vice versa', async () => {
    const bDash = (await b.agent.get(`/api/dashboard${q}`)).body;
    expect(bDash.workout).toBeNull();
    expect(bDash.firstName).toBe('Bob');
    const aDash = (await a.agent.get(`/api/dashboard${q}`)).body;
    expect(aDash.weeklyActivity.reduce((s, d) => s + d.minutes, 0)).toBe(0); // Bob's 15 min aren't here
    expect(aDash.streak.current).toBe(0);
  });

  it('B cannot tick or untick A’s sets', async () => {
    expect((await b.agent.patch('/api/sets').send({ setId: aSet().id, completed: true })).status).toBe(404);
    const [row] = await db()`SELECT completed FROM workout_sets WHERE id = ${aSet().id}`;
    expect(row.completed).toBe(false);
  });

  it.each(['start', 'finish', 'reset'])('B cannot %s A’s workout', async (action) => {
    const res = await b.agent.patch(`/api/workouts${q}`).send({ workoutId: aWorkout.id, action, durationMinutes: 5 });
    expect(res.status).toBe(404);
    const [row] = await db()`SELECT status, user_id FROM workouts WHERE id = ${aWorkout.id}`;
    expect(row.status).toBe('planned');
    expect(row.user_id).toBe(a.user.id);
  });

  it('B cannot remove exercises from A’s workout', async () => {
    const exerciseId = aWorkout.exercises[0].exerciseId;
    expect((await b.agent.delete(`/api/workouts${q}&exerciseId=${exerciseId}`)).status).toBe(404);
    expect((await a.agent.get(`/api/workouts${q}`)).body.workout.exercises).toHaveLength(1);
  });

  it('adding an exercise as B creates B’s own workout, not one inside A’s', async () => {
    const res = await b.agent.post(`/api/workouts${q}`).send({ exerciseId: aWorkout.exercises[0].exerciseId });
    expect(res.body.workout.id).not.toBe(aWorkout.id);
    const [row] = await db()`SELECT user_id FROM workouts WHERE id = ${res.body.workout.id}`;
    expect(row.user_id).toBe(b.user.id);
  });

  it('a stolen user id in the request body changes nothing (the server only trusts the cookie)', async () => {
    const res = await b.agent.get(`/api/workouts${q}&userId=${a.user.id}`).send({ userId: a.user.id });
    expect(res.body.workout?.id).not.toBe(aWorkout.id);
  });

  it('A still has full control of A’s own workout', async () => {
    expect((await a.agent.patch('/api/sets').send({ setId: aSet().id, completed: true })).status).toBe(200);
  });
});

describe('API responses never leak secrets', () => {
  it('no password hashes or connection strings in any response', async () => {
    const { agent } = await signedUpAgent();
    const bodies = await Promise.all(['/api/auth/me', '/api/dashboard', '/api/stats', '/api/exercises', '/api/workouts'].map((p) => agent.get(p)));
    for (const r of bodies) {
      const text = JSON.stringify(r.body);
      expect(text).not.toMatch(/password_hash|\$2[aby]\$|postgres(ql)?:\/\//i);
    }
  });
});
