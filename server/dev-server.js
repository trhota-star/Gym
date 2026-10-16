// Local stand-in for Vercel's serverless functions (see server/app.js).
import { loadEnv, requireDatabaseUrl } from '../scripts/env.js';
import { createApp } from './app.js';

loadEnv();
requireDatabaseUrl();

const PORT = Number(process.env.API_PORT) || 3001;
const { app, routes } = await createApp();

app.listen(PORT, () => {
  console.log(`⚡ API ready on http://localhost:${PORT} (${routes.length} routes: ${routes.join(', ')})`);
});
