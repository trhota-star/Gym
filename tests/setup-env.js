// Loads DATABASE_URL and JWT_SECRET from .env inside each test worker
import { loadEnv } from '../scripts/env.js';

loadEnv();
