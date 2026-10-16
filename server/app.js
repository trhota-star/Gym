// Builds an Express app that serves the exact same files from /api that Vercel will deploy
// (api/auth/login.js → /api/auth/login). Used by the dev server and by the API tests.
import { readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ROOT } from '../scripts/env.js';

const API_DIR = join(ROOT, 'api');
const HERE = dirname(fileURLToPath(import.meta.url));

// Vercel ignores files and folders that start with "_" or ".", so we do too
function* routeFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* routeFiles(full);
    else if (/\.(m?js)$/.test(entry.name)) yield full;
  }
}

export async function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  const routes = [];
  for (const file of routeFiles(API_DIR)) {
    const path = '/api/' + relative(API_DIR, file).split(sep).join('/').replace(/\.m?js$/, '').replace(/(^|\/)index$/, '');
    // A relative specifier works in Node and in Vitest, even with spaces in the folder name
    const specifier = relative(HERE, file).split(sep).join('/');
    const { default: handler } = await import(specifier.startsWith('.') ? specifier : `./${specifier}`);
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

  return { app, routes };
}
