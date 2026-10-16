import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestUsers, completeWorkoutOn, exerciseIds, isoDaysAgo, signedUpAgent } from '../helpers.js';

afterAll(cleanupTestUsers);

// Fake "today": Wednesday 19 March 2025. Its week starts Monday 17 March.
const TODAY = '2025-03-19';
const daysAgo = (n) => isoDaysAgo(TODAY, n);
let plankId;
beforeAll(async () => {
  plankId = (await exerciseIds())['Plank Hold'].id;
});

const dashboard = async (agent, date = TODAY) => {
  const res = await agent.get(`/api/dashboard?date=${date}`);
  expect(res.status).toBe(200);
  return res.body;
};

async function userWithWorkouts(days, minutes = 30) {
  const { agent } = await signedUpAgent({ weeklyGoalWorkouts: 3, weeklyGoalMinutes: 60 });
  for (const n of days) await completeWorkoutOn(agent, daysAgo(n), plankId, minutes);
  return agent;
}

describe('streak', () => {
  it('is 0 with no workouts', async () => {
    const d = await dashboard(await userWithWorkouts([]));
    expect(d.streak).toEqual({ current: 0, best: 0 });
  });

  it('is 3 after 3 days in a row ending today', async () => {
    const d = await dashboard(await userWithWorkouts([2, 1, 0]));
    expect(d.streak).toEqual({ current: 3, best: 3 });
  });

  it('counts a workout today plus yesterday as 2', async () => {
    const d = await dashboard(await userWithWorkouts([1, 0]));
    expect(d.streak.current).toBe(2);
  });

  it('stays alive in the morning if you trained yesterday but not yet today', async () => {
    const d = await dashboard(await userWithWorkouts([2, 1]));
    expect(d.streak.current).toBe(2);
  });

  it('resets after a missed day', async () => {
    // trained 5, 4 and 3 days ago, missed 2 days ago, trained yesterday and today
    const agent = await userWithWorkouts([5, 4, 3, 1, 0]);
    const d = await dashboard(agent);
    expect(d.streak).toEqual({ current: 2, best: 3 });
  });

  it('is 0 when the last workout was 2+ days ago', async () => {
    const d = await dashboard(await userWithWorkouts([3, 2]));
    expect(d.streak).toEqual({ current: 0, best: 2 });
  });

  it('counts two workouts on the same day once', async () => {
    const agent = await userWithWorkouts([0, 0]);
    const d = await dashboard(agent);
    expect(d.streak.current).toBe(1);
    expect(d.weeklyActivity.at(-1).minutes).toBe(60);
  });

  it('ignores planned or unfinished workouts', async () => {
    const { agent } = await signedUpAgent();
    await agent.post(`/api/workouts?date=${TODAY}`).send({ exerciseId: plankId });
    const d = await dashboard(agent);
    expect(d.streak.current).toBe(0);
    expect(d.workout.status).toBe('planned');
  });

  it('matches the streak shown by /api/auth/me', async () => {
    const agent = await userWithWorkouts([1, 0]);
    expect((await agent.get(`/api/auth/me?date=${TODAY}`)).body.user.streak).toBe(2);
  });
});

describe('weekly activity chart', () => {
  it('always has 7 days, oldest first, ending today', async () => {
    const d = await dashboard(await userWithWorkouts([]));
    expect(d.weeklyActivity).toHaveLength(7);
    expect(d.weeklyActivity.map((x) => x.date)).toEqual([6, 5, 4, 3, 2, 1, 0].map(daysAgo));
    expect(d.weeklyActivity.map((x) => x.day)).toEqual(['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']);
    expect(d.weeklyActivity.every((x) => x.minutes === 0 && x.calories === 0)).toBe(true);
  });

  it('puts active minutes on the right day and ignores older days', async () => {
    const agent = await userWithWorkouts([10]); // outside the 7-day window
    await completeWorkoutOn(agent, daysAgo(0), plankId, 25);
    await completeWorkoutOn(agent, daysAgo(3), plankId, 40);
    const d = await dashboard(agent);
    expect(d.weeklyActivity.map((x) => x.minutes)).toEqual([0, 0, 0, 40, 0, 0, 25]);
    expect(d.weeklyActivity.at(-1).calories).toBeGreaterThan(0);
  });

  it('does not count future-dated workouts', async () => {
    const { agent } = await signedUpAgent();
    await completeWorkoutOn(agent, isoDaysAgo(TODAY, -2), plankId, 30);
    const d = await dashboard(agent);
    expect(d.weeklyActivity.reduce((s, x) => s + x.minutes, 0)).toBe(0);
    expect(d.streak.current).toBe(0);
  });
});

describe('progress rings', () => {
  it('start at zero for a new user', async () => {
    const d = await dashboard(await userWithWorkouts([]));
    expect(d.goals).toEqual({
      workouts: { done: 0, target: 3 },
      minutes: { done: 0, target: 60 },
      goals: { done: 0, target: 2 },
    });
  });

  it('count only this calendar week (Monday to today)', async () => {
    // Sunday 16 March is last week; Monday 17 and Wednesday 19 are this week
    const agent = await userWithWorkouts([3, 2, 0], 20);
    const d = await dashboard(agent);
    expect(d.goals.workouts.done).toBe(2);
    expect(d.goals.minutes.done).toBe(40);
    expect(d.goals.goals.done).toBe(0);
  });

  it('report goals hit, and can go past the target (the ring itself caps at 100%)', async () => {
    const agent = await userWithWorkouts([2, 1, 0, 0], 30); // 4 workouts, 120 min vs goals 3 / 60
    const d = await dashboard(agent);
    expect(d.goals.workouts).toEqual({ done: 4, target: 3 });
    expect(d.goals.minutes).toEqual({ done: 120, target: 60 });
    expect(d.goals.goals).toEqual({ done: 2, target: 2 });
  });

  it('returns whole numbers, never null or NaN', async () => {
    const d = await dashboard(await userWithWorkouts([0]));
    for (const g of Object.values(d.goals)) {
      expect(Number.isInteger(g.done)).toBe(true);
      expect(Number.isInteger(g.target)).toBe(true);
      expect(g.target).toBeGreaterThan(0);
    }
  });
});

describe('today’s workout card and next class', () => {
  it('shows today’s workout with its exercises', async () => {
    const { agent } = await signedUpAgent();
    await agent.post(`/api/workouts?date=${TODAY}`).send({ exerciseId: plankId });
    const d = await dashboard(agent);
    expect(d.workout).toMatchObject({ name: 'Core Day', status: 'planned', date: TODAY });
    expect(d.workout.exercises[0].name).toBe('Plank Hold');
    expect(d.firstName).toBe('Vitest');
  });

  it('returns a next class shape (or null when none are left this week)', async () => {
    const d = await dashboard(await userWithWorkouts([]));
    if (d.nextClass) {
      expect(d.nextClass).toMatchObject({ title: expect.any(String), coach: expect.any(String), duration: expect.any(Number) });
      expect(new Date(d.nextClass.startTime).getTime()).toBeGreaterThan(Date.now());
    } else {
      expect(d.nextClass).toBeNull();
    }
  });
});
