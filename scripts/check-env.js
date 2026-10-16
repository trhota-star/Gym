// Runs before `npm run dev`: creates JWT_SECRET if needed and stops early if DATABASE_URL is missing.
import { loadEnv, requireDatabaseUrl } from './env.js';
import { ensureLocalDb, isLocalUrl } from './local-db.js';

loadEnv();
const url = requireDatabaseUrl();
if (isLocalUrl(url)) ensureLocalDb(url);
