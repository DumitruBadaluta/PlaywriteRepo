import { test, expect } from '@playwright/test';

test('Wikipedia navigation', async ({ page }) => {
  await page.goto('https://www.wikipedia.org/');
  await page.getByRole('link', { name: /English/ }).click();

  // Open the hidden main menu before interacting with the sidebar links.
  await page.locator('[aria-label="Main menu"]').click();

  // The page contains two Community portal links with the same visible name, so
  // target the unique sidebar item by its title attribute.
  await page.locator('a[title="The hub for editors"]').click();

  await expect(page).toHaveURL(/Community_portal/);
});