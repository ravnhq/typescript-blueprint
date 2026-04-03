import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Blueprint Web');
});

test('notes page shows an actionable error when the API is unavailable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Notes' }).click();
  await expect(page.locator('h1')).toContainText('Notes');
  await expect(page.getByText(/Failed to load notes/i)).toBeVisible();
});
