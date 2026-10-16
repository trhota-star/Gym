import { cleanupE2EUsers } from './helpers.js';

// Remove anything a previously interrupted run left behind
export default async function globalSetup() {
  await cleanupE2EUsers();
}
