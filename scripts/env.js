// Local-only environment loader used by `npm run dev` and `npm run db:setup`.
// On Vercel, DATABASE_URL and JWT_SECRET come from the project settings instead.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env');

function parse(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

/** Ensures .env exists with a JWT_SECRET, then loads it into process.env (without overriding real env vars). */
export function loadEnv() {
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  const values = parse(text);

  if (!values.DATABASE_URL && !/^\s*DATABASE_URL\s*=/m.test(text)) {
    text = `DATABASE_URL=\n${text}`;
  }
  if (!values.JWT_SECRET && !process.env.JWT_SECRET) {
    const secret = randomBytes(48).toString('base64url');
    text = /^\s*JWT_SECRET\s*=.*$/m.test(text)
      ? text.replace(/^\s*JWT_SECRET\s*=.*$/m, `JWT_SECRET=${secret}`)
      : `${text.replace(/\s*$/, '')}\nJWT_SECRET=${secret}\n`;
    console.log('🔐 Generated a strong random JWT_SECRET and saved it to .env');
  }
  if (text !== readFileSafe()) writeFileSync(ENV_PATH, text);

  for (const [k, v] of Object.entries(parse(text))) {
    if (process.env[k] === undefined && v !== '') process.env[k] = v;
  }
}

const readFileSafe = () => (existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : null);

/** Stops the process with step-by-step instructions when DATABASE_URL is missing. */
export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (url && /^postgres(ql)?:\/\//.test(url)) return url;

  console.error(`
❌ DATABASE_URL is ${url ? 'not a valid postgres:// connection string' : 'missing'} in your .env file.

   Here's where to copy it from:

   1. Open https://console.neon.tech and sign in (the Free plan is fine).
   2. Create a project (e.g. "pulsefit"), or open the one you already have.
   3. On the project dashboard, click the "Connect" button (top right).
   4. In the "Connect to your database" window keep: Branch = main,
      Database = neondb, Role = neondb_owner, and "Connection pooling" ON.
   5. Make sure the dropdown shows "Connection string", click "Show password",
      then "Copy snippet". It looks like:
        postgresql://neondb_owner:xxxx@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   6. Paste it into the .env file in this folder, right after DATABASE_URL=
      (no quotes, no spaces), and save.

   Then run:  npm run db:setup   and after that:  npm run dev
`);
  process.exit(1);
}
