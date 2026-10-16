// Runs once before all backend tests: makes sure the database is running and has the
// schema and sample data (db:setup is idempotent, so real data is left alone).
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, loadEnv, requireDatabaseUrl } from '../scripts/env.js';

export default function setup() {
  loadEnv();
  requireDatabaseUrl();
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'db-setup.js')], { stdio: 'pipe' });
}
