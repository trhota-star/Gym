import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, signUpViaAPI } from './helpers.js';

test.describe('Library → Live Workout → Dashboard', () => {
  test('build a workout, train it, finish it and see the dashboard update', async ({ page }) => {
    await signUpViaAPI(page, { name: 'Taylor Lift' });

    // Empty dashboard
    await page.goto('/#/dashboard');
    await expect(page.getByText('No workout yet today.')).toBeVisible();
    await expect(page.getByText('0 / 3')).toBeVisible(); // workouts ring
    await expectNoHorizontalScroll(page);

    // Library: load all 30, filter, add one exercise
    await page.getByRole('button', { name: 'Open Library' }).click();
    await expect(page).toHaveURL(/#\/library$/);
    await expect(page.locator('article')).toHaveCount(30);
    await page.getByRole('button', { name: /^Core\s*5$/ }).click();
    await expect(page.locator('article')).toHaveCount(5);
    const card = page.locator('article').filter({ hasText: 'Plank Hold' });
    await card.getByRole('button', { name: 'Add to today’s workout' }).click();
    await expect(card.getByRole('button', { name: 'Added to today' })).toBeVisible();
    await expect(page.getByText('Added to today’s workout 💪')).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Survives a refresh: still added
    await page.reload();
    await page.getByRole('button', { name: /^Core\s*5$/ }).click();
    await expect(page.locator('article').filter({ hasText: 'Plank Hold' }).getByRole('button', { name: 'Added to today' })).toBeVisible();

    // Live workout
    await page.getByRole('button', { name: /Start workout \(1\)/ }).click();
    await expect(page).toHaveURL(/#\/workout$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Core Day');
    await expect(page.getByText('0 of 3 sets')).toBeVisible();

    const set = (n) => page.getByRole('button', { name: `Set ${n} of Plank Hold` });
    await set(1).click();
    await expect(set(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Rest timer')).toBeVisible();
    await expect(page.getByText(/^0:4[0-5]$/)).toBeVisible(); // Plank Hold rests 45 s

    // Ticks are saved instantly: a refresh keeps them
    await page.reload();
    await expect(set(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('1 of 3 sets')).toBeVisible();

    // Untick and re-tick works too
    await set(1).click();
    await expect(set(1)).toHaveAttribute('aria-pressed', 'false');
    await set(1).click();
    await set(2).click();
    await set(3).click();

    // Finish → saved → confetti modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Workout crushed!' })).toBeVisible();
    await expect(modal).toContainText('3'); // sets
    await modal.getByRole('button', { name: 'See my dashboard' }).click();

    // Dashboard reflects it
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByText('Completed today')).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible(); // workouts ring
    await expect(page.getByText('day in a row')).toBeVisible();
    await expect(page.getByRole('button', { name: /Review/ })).toBeVisible();

    // Still there after a refresh
    await page.reload();
    await expect(page.getByText('Completed today')).toBeVisible();
  });

  test('Live Workout shows a friendly empty state with no workout today', async ({ page }) => {
    await signUpViaAPI(page);
    await page.goto('/#/workout');
    await expect(page.getByText('No workout yet today')).toBeVisible();
    await page.getByRole('button', { name: 'Open the Library' }).click();
    await expect(page).toHaveURL(/#\/library$/);
  });

  test('removing an exercise from the Library updates today’s workout', async ({ page }) => {
    await signUpViaAPI(page);
    await page.goto('/#/library');
    const card = page.locator('article').filter({ hasText: 'Hammer Curl' });
    await card.getByRole('button', { name: 'Add to today’s workout' }).click();
    await expect(card.getByRole('button', { name: 'Added to today' })).toBeVisible();
    await card.getByRole('button', { name: 'Added to today' }).click();
    await expect(card.getByRole('button', { name: 'Add to today’s workout' })).toBeVisible();
    await expect(page.getByText('Removed from today’s workout')).toBeVisible(); // saved
    await page.goto('/#/dashboard');
    await expect(page.getByText('No workout yet today.')).toBeVisible();
  });

  test('a failed save rolls the tick back and shows an error toast', async ({ page }) => {
    await signUpViaAPI(page);
    const ex = (await (await page.request.get('/api/exercises?muscle_group=Arms')).json()).exercises[0];
    await page.request.post('/api/workouts', { data: { exerciseId: ex.id } });
    await page.goto('/#/workout');
    await page.route('**/api/sets*', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'We can’t reach the PulseFit database right now.', code: 'DB_UNAVAILABLE' }) })
    );
    const first = page.getByRole('button', { name: `Set 1 of ${ex.name}` });
    await first.click();
    await expect(page.getByText('Couldn’t save that set')).toBeVisible();
    await expect(first).toHaveAttribute('aria-pressed', 'false');
  });

  test('dashboard shows a clear message when the database is unreachable', async ({ page }) => {
    await signUpViaAPI(page);
    await page.route('**/api/dashboard*', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'We can’t reach the PulseFit database right now.', code: 'DB_UNAVAILABLE' }) })
    );
    await page.goto('/#/dashboard');
    await expect(page.getByRole('heading', { name: 'Can’t reach the database' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
