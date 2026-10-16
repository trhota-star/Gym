import { expect, test } from '@playwright/test';
import { PASSWORD, isMobile, logoutButton, signUpViaAPI, signUpViaUI, uniqueEmail } from './helpers.js';

test.describe('Sign up, log in and log out', () => {
  test('sign up shows my name in the navbar, and logout returns to the landing page', async ({ page }, testInfo) => {
    const { name } = await signUpViaUI(page, { name: 'Jamie Rivers' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jamie');

    if (isMobile(testInfo)) {
      await expect(page.getByRole('button', { name: `Open profile for ${name}` })).toHaveText('JR');
    } else {
      await expect(page.locator('aside').getByText(name)).toBeVisible();
    }

    await logoutButton(page).click();
    await expect(page).toHaveURL(/#\/landing$/);
    await expect(page.getByText('Logged out')).toBeVisible();
    await page.goto('/#/dashboard');
    await expect(page).toHaveURL(/#\/login$/);
  });

  test('log in sends you back to the page you wanted', async ({ page }) => {
    const { email } = await signUpViaAPI(page);
    await page.context().clearCookies();
    await page.goto('/#/library');
    await expect(page).toHaveURL(/#\/login$/);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/#\/library$/);
    await expect(page.getByText('Find your next move')).toBeVisible();
  });

  test('wrong password shows a friendly error', async ({ page }) => {
    const { email } = await signUpViaAPI(page);
    await page.context().clearCookies();
    await page.goto('/#/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Wrong1234!');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('don’t match');
    await expect(page).toHaveURL(/#\/login$/);
  });

  test('sign up blocks a weak password and a duplicate email', async ({ page }) => {
    await page.goto('/#/signup');
    await page.getByLabel('Full name').fill('Weak Pass');
    await page.getByLabel('Email').fill(uniqueEmail('weak'));
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Create my account' }).click();
    await expect(page.getByRole('alert')).toContainText('a letter and a number');

    const { email } = await signUpViaAPI(page);
    await page.context().clearCookies();
    await page.goto('/#/signup');
    await page.getByLabel('Full name').fill('Copy Cat');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await expect(page.getByRole('alert')).toContainText('already exists');
  });

  test('stays logged in after a page refresh', async ({ page }) => {
    await signUpViaUI(page);
    await page.reload();
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByText('No workout yet today.')).toBeVisible();
  });
});
