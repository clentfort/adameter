import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should allow navigation while a feeding session is in progress', async ({ page }) => {
    // Navigate to feeding page
    await page.goto('/feeding');

    // Start a feeding session on the left breast
    await page.click('button:has-text("Left Breast")');

    // Verify that the session is in progress by checking for the "End Feeding" button
    await expect(page.locator('button:has-text("End Feeding")')).toBeVisible();

    // Verify the timer is running (at least showing 00:00 or more)
    await expect(page.locator(String.raw`text=/\d{2}:\d{2}/`)).toBeVisible();

    // Attempt to navigate to the Diaper page via the navigation bar
    await page.click('a:has-text("Diaper")');

    // Check if the navigation was successful
    await expect(page).toHaveURL(/\/diaper/);
    await expect(page.locator('h1, h2:has-text("Diaper")')).toBeVisible();

    // Navigate back to feeding to ensure the session is still active (state persistence)
    await page.click('a:has-text("Feeding")');
    await expect(page).toHaveURL(/\/feeding/);
    await expect(page.locator('button:has-text("End Feeding")')).toBeVisible();
  });
});
