// Runs a private PostgreSQL instance for local development, stored in ./.localdb and
// listening only on localhost. It uses the PostgreSQL programs already installed on this
// computer and never touches any other database server. Deployed builds use Neon instead.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './env.js';

const DATA_DIR = join(ROOT, '.localdb', 'data');
const LOG_FILE = join(ROOT, '.localdb', 'postgres.log');

export const isLocalUrl = (url = '') => /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);

function findBin() {
  // A data folder only opens with the major version that created it, so prefer that one
  // (installing a newer PostgreSQL later must not break an existing local database)
  const dataVersion = existsSync(join(DATA_DIR, 'PG_VERSION')) ? readFileSync(join(DATA_DIR, 'PG_VERSION'), 'utf8').trim() : null;
  const candidates = [process.env.PG_BIN];
  for (const base of ['C:\\Program Files\\PostgreSQL', 'C:\\Program Files (x86)\\PostgreSQL']) {
    if (!existsSync(base)) continue;
    const versions = readdirSync(base).sort((a, b) => (b === dataVersion) - (a === dataVersion) || Number(b) - Number(a));
    for (const v of versions) candidates.push(join(base, v, 'bin'));
  }
  candidates.push('/usr/lib/postgresql/16/bin', '/opt/homebrew/bin', '/usr/local/bin');
  const exe = process.platform === 'win32' ? '.exe' : '';
  const bin = candidates.find((dir) => dir && existsSync(join(dir, `pg_ctl${exe}`)));
  if (!bin) throw new Error('Could not find PostgreSQL programs (pg_ctl). Install PostgreSQL or set PG_BIN.');
  return (name) => join(bin, `${name}${exe}`);
}

/** Make sure the local database server is running and the database exists. */
export function ensureLocalDb(url) {
  const { port, pathname, username } = new URL(url);
  const db = pathname.slice(1) || 'pulsefit';
  const user = decodeURIComponent(username || 'postgres');
  const tool = findBin();

  if (!existsSync(join(DATA_DIR, 'PG_VERSION'))) {
    console.log('🗄️  Creating the local PulseFit database (first run only)…');
    execFileSync(tool('initdb'), ['-D', DATA_DIR, '-U', user, '-A', 'trust', '-E', 'UTF8', '--locale=C'], { stdio: 'ignore' });
  }

  const ready = () =>
    spawnSync(tool('pg_isready'), ['-h', 'localhost', '-p', port || '5432', '-q']).status === 0;

  if (!ready()) {
    execFileSync(
      tool('pg_ctl'),
      ['-D', DATA_DIR, '-l', LOG_FILE, '-o', `-p ${port || 5432} -c listen_addresses=localhost`, '-w', 'start'],
      { stdio: 'ignore' }
    );
    console.log(`🗄️  Local database running on localhost:${port || 5432}`);
  }

  // -w: never wait at a hidden password prompt. Our private database trusts localhost, so a
  // password request means some other PostgreSQL (e.g. a Windows service) owns this port.
  const psql = (sql, dbName = 'postgres') =>
    execFileSync(tool('psql'), ['-w', '-h', 'localhost', '-p', port || '5432', '-U', user, '-d', dbName, '-tAc', sql], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  let exists;
  try {
    exists = psql(`SELECT 1 FROM pg_database WHERE datname = '${db.replace(/'/g, '')}'`) === '1';
  } catch {
    throw new Error(
      `Port ${port || 5432} is already used by a different PostgreSQL server. ` +
        'Pick a free port in DATABASE_URL in .env (e.g. localhost:5434) and run "npm run dev" again.'
    );
  }
  if (!exists) execFileSync(tool('createdb'), ['-w', '-h', 'localhost', '-p', port || '5432', '-U', user, db]);
}
