# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.js >> Wikipedia navigation
- Location: tests\example.spec.js:3:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /Community_portal/
Error: Target crashed 

Call log:
  - Expect "toHaveURL" with timeout 5000ms
  - Target crashed

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Wikipedia navigation', async ({ page }) => {
  4  |   await page.goto('https://www.wikipedia.org/');
  5  |   await page.getByRole('link', { name: /English/ }).click();
  6  | 
  7  |   // Open the hidden main menu before interacting with the sidebar links.
  8  |   await page.locator('[aria-label="Main menu"]').click();
  9  | 
  10 |   // The page contains two Community portal links with the same visible name, so
  11 |   // target the unique sidebar item by its title attribute.
  12 |   await page.locator('a[title="The hub for editors"]').click();
  13 | 
> 14 |   await expect(page).toHaveURL(/Community_portal/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  15 | });
```