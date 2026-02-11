import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
	test('should allow navigation while a feeding session is in progress', async ({
		page,
	}) => {
		// Navigate to feeding page
		await page.goto('/feeding');

		// Start a feeding session on the left breast
		await page.getByRole('button', { name: 'Left Breast' }).click();

		// Verify that the session is in progress by checking for the "End Feeding" button
		await expect(
			page.getByRole('button', { name: 'End Feeding' }),
		).toBeVisible();

		// Verify the timer is running (at least showing 00:00 or more)
		await expect(page.locator('.text-3xl.font-bold')).toBeVisible();

		// Attempt to navigate to the Diaper page via the navigation bar
		// Use a more robust selector for the navigation link
		await page
			.locator('a')
			.filter({ hasText: /Diaper/ })
			.click();

		// Check if the navigation was successful
		await expect(page).toHaveURL(/\/diaper/);
		await expect(page.getByText('Urine Only')).toBeVisible();

		// Navigate back to feeding to ensure the session is still active (state persistence)
		await page
			.locator('a')
			.filter({ hasText: /Feeding/ })
			.click();
		await expect(page).toHaveURL(/\/feeding/);
		await expect(
			page.getByRole('button', { name: 'End Feeding' }),
		).toBeVisible();
	});
});
