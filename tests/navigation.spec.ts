import { expect, test } from './fixtures/test';

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
		await expect(page.getByTestId('feeding-timer')).toBeVisible();

		await page.getByRole('link', { name: 'Diaper' }).click();

		// Check if the navigation was successful
		await expect(page).toHaveURL(/\/diaper/);
		await expect(page.getByTestId('quick-urine-button')).toBeVisible();

		await page.getByRole('link', { name: 'Feeding' }).click();
		await expect(page).toHaveURL(/\/feeding/);
		await expect(
			page.getByRole('button', { name: 'End Feeding' }),
		).toBeVisible();
	});
});
