import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestUsers, exerciseIds, signedUpAgent } from '../helpers.js';

afterAll(cleanupTestUsers);

const DATE = '2025-06-11'; // a fixed "today" so the test never collides with real days
const q = `?date=${DATE}`;
let ex;
beforeAll(async () => {
  ex = await exerciseIds();
});

describe('/api/workouts', () => {
  it('returns null when there is no workout today', async () => {
    const { agent } = await signedUpAgent();
    const res = await agent.get(`/api/workouts${q}`);
    expect(res.status).toBe(200);
    expect(res.body.workout).toBeNull();
  });

  it('creates today’s workout when the first exercise is added, with one row per set', async () => {
    const { agent } = await signedUpAgent();
    const plank = ex['Plank Hold'];
    const res = await agent.post(`/api/workouts${q}`).send({ exerciseId: plank.id });
    expect(res.status).toBe(201);
    const w = res.body.workout;
    expect(w).toMatchObject({ date: DATE, status: 'planned', name: 'Core Day', muscleGroups: ['Core'], totalSets: plank.sets, completedSets: 0 });
    expect(w.exercises).toHaveLength(1);
    expect(w.exercises[0].sets.map((s) => s.setNumber)).toEqual([1, 2, 3].slice(0, plank.sets));
    expect(w.exercises[0].sets.every((s) => s.completed === false)).toBe(true);
    expect(w.exercises[0].restSeconds).toBe(45);
  });

  it('adds more exercises in order, renames the workout, and never duplicates', async () => {
    const { agent } = await signedUpAgent();
    await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id });
    await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Barbell Bench Press'].id });
    const again = await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id });
    expect(again.status).toBe(201);
    const w = again.body.workout;
    expect(w.exercises.map((e) => e.name)).toEqual(['Plank Hold', 'Barbell Bench Press']);
    expect(w.name).toBe('Core & Chest Day');
    expect(w.totalSets).toBe(ex['Plank Hold'].sets + ex['Barbell Bench Press'].sets);

    await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Back Squat'].id });
    expect((await agent.get(`/api/workouts${q}`)).body.workout.name).toBe('Full Body Mix');
  });

  it('removes an exercise from today’s workout', async () => {
    const { agent } = await signedUpAgent();
    await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id });
    await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Hammer Curl'].id });
    const res = await agent.delete(`/api/workouts${q}&exerciseId=${ex['Plank Hold'].id}`);
    expect(res.status).toBe(200);
    expect(res.body.workout.exercises.map((e) => e.name)).toEqual(['Hammer Curl']);
    expect(res.body.workout.name).toBe('Arms Day');
  });

  it('rejects bad input', async () => {
    const { agent } = await signedUpAgent();
    expect((await agent.post(`/api/workouts${q}`).send({})).status).toBe(400);
    expect((await agent.post(`/api/workouts${q}`).send({ exerciseId: 'abc' })).status).toBe(400);
    expect((await agent.post(`/api/workouts${q}`).send({ exerciseId: 999999 })).status).toBe(404);
    expect((await agent.delete(`/api/workouts${q}&exerciseId=1`)).status).toBe(404); // nothing planned yet
    expect((await agent.patch(`/api/workouts${q}`).send({ action: 'start' })).status).toBe(400);
    expect((await agent.patch(`/api/workouts${q}`).send({ workoutId: 999999, action: 'start' })).status).toBe(404);
  });

  it('runs the full flow: start → tick → finish', async () => {
    const { agent } = await signedUpAgent();
    const { workout } = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Jump Rope Rounds'].id })).body;

    const started = await agent.patch(`/api/workouts${q}`).send({ workoutId: workout.id, action: 'start' });
    expect(started.body.workout.status).toBe('in_progress');
    const startedAt = started.body.workout.startedAt;
    expect(startedAt).toBeTruthy();
    const startedAgain = await agent.patch(`/api/workouts${q}`).send({ workoutId: workout.id, action: 'start' });
    expect(startedAgain.body.workout.startedAt).toBe(startedAt); // starting twice keeps the first time

    for (const s of workout.exercises[0].sets) {
      const r = await agent.patch('/api/sets').send({ setId: s.id, completed: true });
      expect(r.status).toBe(200);
    }
    expect((await agent.get(`/api/workouts${q}`)).body.workout.completedSets).toBe(workout.totalSets);

    const finished = await agent.patch(`/api/workouts${q}`).send({ workoutId: workout.id, action: 'finish', durationMinutes: 18 });
    expect(finished.status).toBe(200);
    expect(finished.body.workout).toMatchObject({ status: 'completed', durationMinutes: 18 });
    expect(finished.body.workout.completedAt).toBeTruthy();
    expect(finished.body.streak).toBe(1);

    // Finishing twice doesn't overwrite the saved duration
    const twice = await agent.patch(`/api/workouts${q}`).send({ workoutId: workout.id, action: 'finish', durationMinutes: 99 });
    expect(twice.body.workout.durationMinutes).toBe(18);
  });

  it('clamps a silly duration and fills one in when it is missing', async () => {
    const { agent } = await signedUpAgent();
    const a = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id })).body.workout;
    const r1 = await agent.patch(`/api/workouts${q}`).send({ workoutId: a.id, action: 'finish', durationMinutes: 100000 });
    expect(r1.body.workout.durationMinutes).toBe(600);
    const b = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id })).body.workout;
    const r2 = await agent.patch(`/api/workouts${q}`).send({ workoutId: b.id, action: 'finish' });
    expect(r2.body.workout.durationMinutes).toBeGreaterThanOrEqual(1);
  });

  it('locks a finished workout, and adding again starts a new one', async () => {
    const { agent } = await signedUpAgent();
    const w = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id })).body.workout;
    await agent.patch(`/api/workouts${q}`).send({ workoutId: w.id, action: 'finish', durationMinutes: 5 });

    expect((await agent.patch('/api/sets').send({ setId: w.exercises[0].sets[0].id, completed: true })).status).toBe(409);
    expect((await agent.delete(`/api/workouts${q}&exerciseId=${ex['Plank Hold'].id}`)).status).toBe(409);

    const next = await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Hammer Curl'].id });
    expect(next.status).toBe(201);
    expect(next.body.workout.id).not.toBe(w.id);
    expect(next.body.workout.status).toBe('planned');
  });

  it('reset clears an unfinished workout, and copies a finished one into a fresh round', async () => {
    const { agent } = await signedUpAgent();
    const w = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id })).body.workout;
    await agent.patch('/api/sets').send({ setId: w.exercises[0].sets[0].id, completed: true });
    const cleared = await agent.patch(`/api/workouts${q}`).send({ workoutId: w.id, action: 'reset' });
    expect(cleared.body.workout).toMatchObject({ id: w.id, status: 'in_progress', completedSets: 0 });

    await agent.patch(`/api/workouts${q}`).send({ workoutId: w.id, action: 'finish', durationMinutes: 7 });
    const copy = await agent.patch(`/api/workouts${q}`).send({ workoutId: w.id, action: 'reset' });
    expect(copy.body.workout.id).not.toBe(w.id);
    expect(copy.body.workout).toMatchObject({ status: 'in_progress', completedSets: 0, totalSets: w.totalSets });
    // The finished one is still in history
    const dash = await agent.get(`/api/dashboard${q}`);
    expect(dash.body.weeklyActivity.at(-1).minutes).toBe(7);
  });

  it('rejects an unknown action', async () => {
    const { agent } = await signedUpAgent();
    const w = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Plank Hold'].id })).body.workout;
    expect((await agent.patch(`/api/workouts${q}`).send({ workoutId: w.id, action: 'explode' })).status).toBe(400);
  });
});

describe('/api/sets', () => {
  it('ticks and unticks a set', async () => {
    const { agent } = await signedUpAgent();
    const w = (await agent.post(`/api/workouts${q}`).send({ exerciseId: ex['Hammer Curl'].id })).body.workout;
    const set = w.exercises[0].sets[1];

    const on = await agent.patch('/api/sets').send({ setId: set.id, completed: true });
    expect(on.status).toBe(200);
    expect(on.body.set).toEqual({ id: set.id, setNumber: 2, completed: true });
    let now = (await agent.get(`/api/workouts${q}`)).body.workout;
    expect(now.completedSets).toBe(1);
    expect(now.status).toBe('in_progress'); // ticking the first set starts the workout

    const off = await agent.patch('/api/sets').send({ setId: set.id, completed: false });
    expect(off.body.set.completed).toBe(false);
    now = (await agent.get(`/api/workouts${q}`)).body.workout;
    expect(now.completedSets).toBe(0);
  });

  it('rejects bad input', async () => {
    const { agent } = await signedUpAgent();
    expect((await agent.patch('/api/sets').send({ completed: true })).status).toBe(400);
    expect((await agent.patch('/api/sets').send({ setId: 1, completed: 'yes' })).status).toBe(400);
    expect((await agent.patch('/api/sets').send({ setId: 999999, completed: true })).status).toBe(404);
    expect((await agent.get('/api/sets')).status).toBe(405);
  });
});
