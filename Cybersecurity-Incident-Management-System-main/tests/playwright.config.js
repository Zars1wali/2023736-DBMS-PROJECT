import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 * See https://playwright.dev/docs/test-configuration
 *
 * To install Playwright browsers: npx playwright install
 * To run E2E tests:               npx playwright test --config tests/playwright.config.js
 * To view HTML report:             npx playwright show-report
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    },
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'API',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd backend && npm run dev',
        url: 'http://localhost:3000/health',
        reuseExistingServer: !process.env.CI,
        timeout: 15_000
      }
});
