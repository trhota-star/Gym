// The only way the browser talks to data: relative /api calls with the session cookie.
// No database credentials ever live in this bundle.

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SERVER_DOWN = 'We can’t reach the PulseFit server. Make sure “npm run dev” is running, then try again.';

/** The user's local calendar date (YYYY-MM-DD), so "today" means their today. */
export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('date', localDate());
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(SERVER_DOWN, 0, 'NETWORK');
  }

  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    window.dispatchEvent(new Event('pulsefit:unauthorized'));
  }
  // A proxy error (API process not running) comes back without our JSON body
  if (!data && res.status >= 500) throw new ApiError(SERVER_DOWN, res.status, 'NETWORK');
  throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status, data?.code);
}

export const isOffline = (err) => err?.code === 'DB_UNAVAILABLE' || err?.code === 'NETWORK';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';
