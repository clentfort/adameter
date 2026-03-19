import { test, expect } from '@playwright/test';

test.describe('Statistics Chart Type Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Skip profile prompt
    await page.addInitScript(() => {
      window.localStorage.setItem('adameter-skip-profile', 'true');
    });
  });

  test('should toggle between Bar and Area charts', async ({ page }) => {
    await page.goto('/statistics');

    // Check if the toggle exists
    const barTab = page.locator('button[role="tab"]').filter({ hasText: 'Bar' });
    const areaTab = page.locator('button[role="tab"]').filter({ hasText: 'Area' });

    await expect(barTab).toBeVisible();
    await expect(areaTab).toBeVisible();

    // Verify default Bar chart
    await expect(barTab).toHaveAttribute('data-active', '');

    // Switch to Area chart
    await areaTab.click();
    await expect(areaTab).toHaveAttribute('data-active', '');

    // Reload to verify persistence
    await page.reload();
    await expect(areaTab).toHaveAttribute('data-active', '');

    // Switch back to Bar
    await barTab.click();
    await expect(barTab).toHaveAttribute('data-active', '');
  });
});
