// Tiny helpers shared by every /api route. Route files export `route({ GET, POST, ... })`,
// which works the same under Vercel and under the local Express dev server.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const DB_DOWN_MESSAGE =
  "We can't reach the PulseFit database right now. Check your internet connection and DATABASE_URL, then try again.";

// SQLSTATE classes that mean "the database is unavailable", not "your query is wrong":
// 08 connection, 28 auth, 53 resources, 57 operator intervention (e.g. compute suspended)
const UNAVAILABLE_SQLSTATE = /^(08|28|53|57)/;
const NETWORK_ERROR = /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|connect|socket|network/i;

function toHttpError(err) {
  if (err instanceof HttpError) return err;
  const code = typeof err?.code === 'string' ? err.code : '';
  if (code === '23505') return new HttpError(409, 'That already exists.');
  if (UNAVAILABLE_SQLSTATE.test(code)) return new HttpError(503, DB_DOWN_MESSAGE);
  if (!/^[0-9A-Z]{5}$/.test(code) && NETWORK_ERROR.test(`${err?.message} ${err?.cause?.message ?? ''}`)) {
    return new HttpError(503, DB_DOWN_MESSAGE);
  }
  return null;
}

export function route(handlers) {
  return async function handler(req, res) {
    const fn = handlers[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
    res.setHeader('Cache-Control', 'no-store');
    try {
      const data = await fn(req, res);
      return res.json(data ?? { ok: true });
    } catch (err) {
      const httpErr = toHttpError(err);
      if (!httpErr || httpErr.status >= 500) console.error(`[api] ${req.method} ${req.url}`, err);
      const status = httpErr?.status ?? 500;
      return res.status(status).json({
        error: httpErr?.message ?? 'Something went wrong on our side. Please try again.',
        ...(status === 503 && { code: 'DB_UNAVAILABLE' }),
      });
    }
  };
}

export const body = (req) => (req.body && typeof req.body === 'object' ? req.body : {});

// ---- Dates ---------------------------------------------------------------
// The browser sends its own local date (YYYY-MM-DD) so "today" matches the user's
// calendar no matter where the server runs. All day maths uses UTC to avoid DST drift.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function clientDate(req) {
  const d = req.query?.date ?? body(req).date;
  if (typeof d === 'string' && ISO_DATE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`))) return d;
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const weekdayShort = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

/** Monday of the week containing `iso`. */
export function weekStart(iso) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}

export function toInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
