// npm run db:setup → creates the tables (db/schema.sql) then loads sample data (db/seed.sql).
// Safe to run as often as you like: nothing is duplicated.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool as NeonPool } from '@neondatabase/serverless';
import { ROOT, loadEnv, requireDatabaseUrl } from './env.js';
import { ensureLocalDb, isLocalUrl } from './local-db.js';

loadEnv();
const url = requireDatabaseUrl();
let pool;
if (isLocalUrl(url)) {
  ensureLocalDb(url);
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: url });
} else {
  pool = new NeonPool({ connectionString: url });
}

// Schedule the sample classes in your own time zone
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

try {
  const client = await pool.connect();
  try {
    await client.query(`SET TIME ZONE '${timeZone.replace(/'/g, '')}'`);
    for (const file of ['schema.sql', 'seed.sql']) {
      await client.query('BEGIN');
      await client.query(readFileSync(join(ROOT, 'db', file), 'utf8'));
      await client.query('COMMIT');
      console.log(`✅ Ran db/${file}`);
    }

    const { rows } = await client.query(`
      SELECT (SELECT COUNT(*) FROM exercises)::int AS exercises,
             (SELECT COUNT(*) FROM classes)::int   AS classes,
             (SELECT COUNT(*) FROM users)::int     AS users`);
    const { rows: byGroup } = await client.query(
      'SELECT muscle_group, COUNT(*)::int AS n FROM exercises GROUP BY muscle_group ORDER BY muscle_group'
    );

    console.log('\n📊 Row counts');
    console.table(rows[0]);
    console.log('Exercises per muscle group:', Object.fromEntries(byGroup.map((r) => [r.muscle_group, r.n])));
    console.log(`Classes are scheduled for this week (${timeZone} time).`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
} catch (err) {
  console.error('\n❌ Database setup failed:', err.message);
  if (/password|auth/i.test(err.message)) console.error('   Check that DATABASE_URL in .env was copied completely, including the password.');
  else if (/ENOTFOUND|fetch|connect|WebSocket/i.test(err.message)) console.error('   Could not reach Neon. Check your internet connection and the host in DATABASE_URL.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
