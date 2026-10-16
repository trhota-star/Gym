import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './helpers.js';

test.describe('Landing page (public)', () => {
  test('loads with PulseFit in the tab title, navbar and hero', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    // A logged-out visitor's /api/auth/me is a deliberate 401, which Chrome logs as a resource error
    page.on('console', (m) => m.type() === 'error' && !/status of 401/.test(m.text()) && errors.push(m.text()));

    await page.goto('/');
    await expect(page).toHaveTitle(/PulseFit/);

    const navbar = page.locator('header').first();
    await expect(navbar.getByRole('button', { name: 'PulseFit home' })).toContainText('PulseFit');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Train smarter.');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Get stronger.');
    await expect(page.locator('section').first().getByText('PulseFit', { exact: true })).toBeVisible();

    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });

  test('stat counters animate up to the real numbers from the database', async ({ page }) => {
    const stats = await (await page.request.get('/api/stats')).json();
    // Record every number the counters show, from inside the page, while they animate
    await page.addInitScript(() => {
      window.__counterValues = [];
      new MutationObserver(() => {
        document.querySelectorAll('dl dd').forEach((dd, i) => window.__counterValues.push([i, dd.textContent.trim()]));
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await page.goto('/');
    // Counters start when they scroll into view (on a phone they're below the fold)
    await page.locator('dl').scrollIntoViewIfNeeded();

    const counter = (label) => page.locator('dl > div').filter({ hasText: label }).locator('dd');
    await expect(counter('Classes this week')).toHaveText(String(stats.classesThisWeek));
    await expect(counter('Members')).toHaveText(stats.members.toLocaleString('en-US'));
    await expect(counter('Workouts completed')).toHaveText(stats.workoutsCompleted.toLocaleString('en-US'));

    // "Classes this week" (the 3rd counter) passed through smaller numbers on its way to 10
    const shown = (await page.evaluate(() => window.__counterValues)).filter(([i, v]) => i === 2 && /^\d+$/.test(v)).map(([, v]) => Number(v));
    expect(shown[0]).toBe(0);
    expect(new Set(shown).size).toBeGreaterThan(2);
    expect(shown.at(-1)).toBe(stats.classesThisWeek);
  });

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start Your Workout/ }).first().click();
    await expect(page).toHaveURL(/#\/signup$/);
    await expect(page.getByRole('button', { name: 'Create my account' })).toBeVisible();
  });

  test('members-only pages send you to log in', async ({ page }) => {
    for (const p of ['dashboard', 'library', 'workout']) {
      await page.goto(`/#/${p}`);
      await expect(page).toHaveURL(/#\/login$/);
      await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    }
  });

  test('shows a clear message when the stats API is down', async ({ page }) => {
    await page.route('**/api/stats*', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'We can’t reach the PulseFit database right now.', code: 'DB_UNAVAILABLE' }) })
    );
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Live stats are unavailable');
  });
});
