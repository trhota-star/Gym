import { neon } from '@neondatabase/serverless';
import { HttpError } from './http.js';

let sql;

const isLocal = (url) => /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);

// Same tagged-template API as Neon's driver (`sql\`... ${value}\`` → rows), backed by a
// regular `pg` pool. Only used for a database on this computer during local development.
function localSql(url) {
  const poolPromise = import('pg').then(({ default: pg }) => new pg.Pool({ connectionString: url, max: 5 }));
  return async (strings, ...values) => {
    const text = strings.reduce((acc, part, i) => `${acc}$${i}${part}`);
    const pool = await poolPromise;
    return (await pool.query(text, values)).rows;
  };
}

/** Database query function. Server-side only: never import this from /src. */
export function db() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new HttpError(503, 'The server has no DATABASE_URL configured, so the database is unavailable.');
    sql = isLocal(url) ? localSql(url) : neon(url);
  }
  return sql;
}
