// Runs a private PostgreSQL instance for local development, stored in ./.localdb and
// listening only on localhost. It uses the PostgreSQL programs already installed on this
// computer and never touches any other database server. Deployed builds use Neon instead.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './env.js';

const DATA_DIR = join(ROOT, '.localdb', 'data');
const LOG_FILE = join(ROOT, '.localdb', 'postgres.log');

export const isLocalUrl = (url = '') => /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);

function findBin() {
  const candidates = [process.env.PG_BIN];
  for (const base of ['C:\\Program Files\\PostgreSQL', 'C:\\Program Files (x86)\\PostgreSQL']) {
    if (!existsSync(base)) continue;
    for (const v of readdirSync(base).sort((a, b) => Number(b) - Number(a))) candidates.push(join(base, v, 'bin'));
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

  const psql = (sql, dbName = 'postgres') =>
    execFileSync(tool('psql'), ['-h', 'localhost', '-p', port || '5432', '-U', user, '-d', dbName, '-tAc', sql], { encoding: 'utf8' }).trim();
  if (psql(`SELECT 1 FROM pg_database WHERE datname = '${db.replace(/'/g, '')}'`) !== '1') {
    execFileSync(tool('createdb'), ['-h', 'localhost', '-p', port || '5432', '-U', user, db]);
  }
}
