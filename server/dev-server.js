// Local stand-in for Vercel's serverless functions. It loads the exact same files from /api
// (api/auth/login.js → /api/auth/login) so nothing changes at deploy time.
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { ROOT, loadEnv, requireDatabaseUrl } from '../scripts/env.js';

loadEnv();
requireDatabaseUrl();

const PORT = Number(process.env.API_PORT) || 3001;
const API_DIR = join(ROOT, 'api');

// Vercel ignores files and folders that start with "_" or ".", so we do too
function* routeFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* routeFiles(full);
    else if (/\.(m?js)$/.test(entry.name)) yield full;
  }
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

const routes = [];
for (const file of routeFiles(API_DIR)) {
  const path = '/api/' + relative(API_DIR, file).split(sep).join('/').replace(/\.m?js$/, '').replace(/(^|\/)index$/, '');
  const { default: handler } = await import(pathToFileURL(file).href);
  if (typeof handler !== 'function') {
    console.warn(`⚠️  ${relative(ROOT, file)} has no default export, skipping`);
    continue;
  }
  app.all(path, (req, res) => handler(req, res));
  routes.push(path);
}

app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` }));

// Malformed JSON bodies and other unexpected errors still answer in JSON
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status === 400 ? 'The request body is not valid JSON.' : 'Something went wrong on our side.' });
});

app.listen(PORT, () => {
  console.log(`⚡ API ready on http://localhost:${PORT} (${routes.length} routes: ${routes.join(', ')})`);
});
