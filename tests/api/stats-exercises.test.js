import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { cleanupTestUsers, completeWorkoutOn, exerciseIds, getApp, signedUpAgent } from '../helpers.js';
import { localDateForTests } from '../dates.js';

afterAll(cleanupTestUsers);

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio'];

describe('GET /api/stats', () => {
  it('returns members, workouts completed and classes this week as numbers', async () => {
    const res = await request(await getApp()).get('/api/stats');
    expect(res.status).toBe(200);
    for (const key of ['members', 'workoutsCompleted', 'classesThisWeek']) {
      expect(typeof res.body[key]).toBe('number');
      expect(Number.isInteger(res.body[key])).toBe(true);
      expect(res.body[key]).toBeGreaterThanOrEqual(0);
    }
    expect(res.body.classesThisWeek).toBe(10);
  });

  it('counts new members and completed workouts', async () => {
    const app = await getApp();
    const before = (await request(app).get('/api/stats')).body;
    const { agent } = await signedUpAgent();
    const ex = (await exerciseIds())['Plank Hold'];
    await completeWorkoutOn(agent, localDateForTests(), ex.id, 10);
    const after = (await request(app).get('/api/stats')).body;
    expect(after.members).toBe(before.members + 1);
    expect(after.workoutsCompleted).toBe(before.workoutsCompleted + 1);
  });

  it('is public (no login needed)', async () => {
    expect((await request(await getApp()).get('/api/stats')).status).toBe(200);
  });
});

describe('GET /api/exercises', () => {
  it('returns all 30 exercises with full details', async () => {
    const res = await request(await getApp()).get('/api/exercises');
    expect(res.status).toBe(200);
    expect(res.body.exercises).toHaveLength(30);
    expect(res.body.muscleGroups).toEqual(GROUPS);
    for (const e of res.body.exercises) {
      expect(e).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        sets: expect.any(Number),
        reps: expect.any(String),
        restSeconds: expect.any(Number),
        description: expect.any(String),
      });
      expect(GROUPS).toContain(e.muscleGroup);
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(e.difficulty);
    }
    expect(new Set(res.body.exercises.map((e) => e.name)).size).toBe(30);
  });

  it.each(GROUPS)('filters by muscle group: %s', async (group) => {
    const res = await request(await getApp()).get(`/api/exercises?muscle_group=${group}`);
    expect(res.status).toBe(200);
    expect(res.body.exercises).toHaveLength(5);
    expect(res.body.exercises.every((e) => e.muscleGroup === group)).toBe(true);
  });

  it('rejects an unknown muscle group', async () => {
    const res = await request(await getApp()).get('/api/exercises?muscle_group=Toes');
    expect(res.status).toBe(400);
  });
});
