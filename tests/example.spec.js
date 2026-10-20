import { test, expect } from '@playwright/test';

test('Wikipedia navigation', async ({ page }) => {
  await page.goto('https://en.wikipedia.org/wiki/Wikipedia:Community_portal', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page).toHaveURL(/Community_portal/);
  await expect(page.getByRole('heading', { name: /Community portal/i }).first()).toBeVisible();
});