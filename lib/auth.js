import { SignJWT, jwtVerify } from 'jose';
import { HttpError } from './http.js';

const COOKIE = 'pf_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(500, 'The server is missing a valid JWT_SECRET.');
  return new TextEncoder().encode(secret);
}

function cookie(value, maxAge) {
  const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  // Browsers drop Secure cookies on plain-http localhost, so only add it when deployed
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export async function startSession(res, userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  res.setHeader('Set-Cookie', cookie(token, MAX_AGE));
}

export function endSession(res) {
  res.setHeader('Set-Cookie', cookie('', 0));
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** The logged-in user's id, or null when there's no valid session cookie. */
export async function sessionUserId(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    return null; // expired or tampered token
  }
}

export async function requireUser(req) {
  const id = await sessionUserId(req);
  if (!id) throw new HttpError(401, 'Please log in to continue.');
  return id;
}

export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  fullName: u.full_name,
  weeklyGoalWorkouts: u.weekly_goal_workouts,
  weeklyGoalMinutes: u.weekly_goal_minutes,
});
