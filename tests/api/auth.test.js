import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { db } from '../../lib/db.js';
import { PASSWORD, cleanupTestUsers, getApp, signedUpAgent, uniqueEmail } from '../helpers.js';

afterAll(cleanupTestUsers);

const signup = async (body) => request(await getApp()).post('/api/auth/signup').send(body);
const valid = (extra = {}) => ({ fullName: 'Vitest Tester', email: uniqueEmail('auth'), password: PASSWORD, ...extra });

describe('POST /api/auth/signup', () => {
  it('creates an account and sets an httpOnly session cookie', async () => {
    const body = valid({ weeklyGoalWorkouts: 5, weeklyGoalMinutes: 200 });
    const res = await signup(body);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: body.email, fullName: 'Vitest Tester', weeklyGoalWorkouts: 5, weeklyGoalMinutes: 200, streak: 0 });
    expect(res.body.user).not.toHaveProperty('password_hash');
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^pf_session=.+/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    const body = valid();
    await signup(body);
    const [row] = await db()`SELECT password_hash FROM users WHERE email = ${body.email}`;
    expect(row.password_hash).not.toBe(PASSWORD);
    expect(row.password_hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it('blocks a duplicate email, even with different capitals', async () => {
    const body = valid();
    expect((await signup(body)).status).toBe(201);
    const again = await signup({ ...body, email: body.email.toUpperCase() });
    expect(again.status).toBe(409);
    expect(again.body.error).toMatch(/already exists/i);
  });

  it.each([
    ['empty', ''],
    ['too short', 'Ab1!'],
    ['letters only', 'password'],
    ['numbers only', '12345678'],
  ])('blocks a weak password (%s)', async (_label, password) => {
    const res = await signup(valid({ password }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('blocks a missing name or invalid email', async () => {
    expect((await signup(valid({ fullName: '' }))).status).toBe(400);
    expect((await signup(valid({ email: 'not-an-email' }))).status).toBe(400);
    expect((await signup({})).status).toBe(400);
  });

  it('keeps weekly goals within sensible limits', async () => {
    const res = await signup(valid({ weeklyGoalWorkouts: 999, weeklyGoalMinutes: -5 }));
    expect(res.status).toBe(201);
    expect(res.body.user.weeklyGoalWorkouts).toBe(14);
    expect(res.body.user.weeklyGoalMinutes).toBe(10);
  });
});

describe('POST /api/auth/login and /api/auth/logout', () => {
  it('logs in with the right password', async () => {
    const { email } = await signedUpAgent();
    const res = await request(await getApp()).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.headers['set-cookie'][0]).toMatch(/pf_session=.+; .*HttpOnly/);
  });

  it('accepts the email in any capitalisation', async () => {
    const { email } = await signedUpAgent();
    const res = await request(await getApp()).post('/api/auth/login').send({ email: ` ${email.toUpperCase()} `, password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    const { email } = await signedUpAgent();
    const app = await getApp();
    const wrong = await request(app).post('/api/auth/login').send({ email, password: 'Wrong1234!' });
    const unknown = await request(app).post('/api/auth/login').send({ email: uniqueEmail('nobody'), password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });

  it('rejects an empty login', async () => {
    expect((await request(await getApp()).post('/api/auth/login').send({})).status).toBe(400);
  });

  it('logout clears the cookie and ends the session', async () => {
    const { agent } = await signedUpAgent();
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect(out.headers['set-cookie'][0]).toMatch(/pf_session=;.*Max-Age=0/);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the logged-in user', async () => {
    const { agent, email } = await signedUpAgent({ fullName: 'Morgan Lee' });
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email, fullName: 'Morgan Lee', streak: 0 });
  });

  it('returns 401 when logged out', async () => {
    expect((await request(await getApp()).get('/api/auth/me')).status).toBe(401);
  });

  it('returns 401 for a forged or tampered token', async () => {
    const app = await getApp();
    const forged = await request(app).get('/api/auth/me').set('Cookie', 'pf_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.bad');
    expect(forged.status).toBe(401);
  });

  it('only accepts POST for login, signup and logout', async () => {
    const app = await getApp();
    for (const path of ['/api/auth/login', '/api/auth/signup', '/api/auth/logout']) {
      expect((await request(app).get(path)).status).toBe(405);
    }
  });
});
