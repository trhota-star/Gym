import { cleanupE2EUsers } from './helpers.js';

// Browser tests only ever create @pulsefit-e2e.dev accounts; delete them (and their workouts)
export default async function globalTeardown() {
  await cleanupE2EUsers();
}
