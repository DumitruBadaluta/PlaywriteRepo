import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
      },
    },
    {
      name: 'firefox-mobile',
      use: {
        ...devices['Pixel 5'],
        browserName: 'firefox',
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 12'],
        browserName: 'webkit',
      },
    },
  ],
});