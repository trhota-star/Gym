import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from './scripts/env.js';

loadEnv();

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // One at a time: each test is independent, but this laptop also runs the app and database
  workers: 1,
  // A test that only passes on its retry is reported as "flaky", never silently hidden
  retries: 1,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // iPhone 13 screen size, touch and user agent, rendered by Chrome
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium', channel: 'chrome' } },
  ],
  // Reuses the app if `npm run dev` is already running, otherwise starts it
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
