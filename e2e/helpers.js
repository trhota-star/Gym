import { expect } from '@playwright/test';
import { loadEnv } from '../scripts/env.js';
import { db } from '../lib/db.js';

loadEnv();

export const E2E_DOMAIN = '@pulsefit-e2e.dev';
export const PASSWORD = 'Test1234!';

export const uniqueEmail = (tag) => `pw-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${E2E_DOMAIN}`;

export async function cleanupE2EUsers() {
  await db()`DELETE FROM users WHERE email LIKE ${`%${E2E_DOMAIN}`}`;
}

export const isMobile = (testInfo) => testInfo.project.name === 'iphone';

/** Sign up through the real form. Ends on the dashboard. */
export async function signUpViaUI(page, { name = 'Riley Tester', email = uniqueEmail('ui') } = {}) {
  await page.goto('/#/signup');
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('radio', { name: '3' }).click();
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page).toHaveURL(/#\/dashboard$/);
  return { name, email };
}

/** Sign up through the API (faster) and share the session cookie with the page. */
export async function signUpViaAPI(page, { name = 'Casey Tester', email = uniqueEmail('api') } = {}) {
  const res = await page.request.post('/api/auth/signup', {
    data: { fullName: name, email, password: PASSWORD, weeklyGoalWorkouts: 3, weeklyGoalMinutes: 60 },
  });
  expect(res.status()).toBe(201);
  return { name, email };
}

/** The visible "Log out" button (sidebar on desktop, top bar on mobile). */
export const logoutButton = (page) => page.getByRole('button', { name: 'Log out' });

/** No sideways scrolling: the page must fit the screen width. */
export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
