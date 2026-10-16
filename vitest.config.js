import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    globalSetup: './tests/global-setup.js',
    setupFiles: ['./tests/setup-env.js'],
    // Files share one database, so run them one after another for predictable counts
    fileParallelism: false,
    testTimeout: 45_000,
    hookTimeout: 60_000,
  },
});
