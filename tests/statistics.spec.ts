import { expect, test } from '@playwright/test';

test.describe('Statistics Page', () => {
	test('should show no data message when app is empty', async ({ page }) => {
		await page.goto('/statistics');
		await expect(page.getByTestId('no-data-message')).toBeVisible();
		await expect(
			page.getByText('No data available for the selected time range.'),
		).toBeVisible();
	});

	test('should show statistics after adding data', async ({ page }) => {
		// 1. Add a feeding session
		await page.goto('/feeding');
		await page.getByRole('button', { name: 'Left Breast' }).click();
		await page.getByRole('button', { name: 'End Feeding' }).click();

		// 2. Add a diaper change
		await page.goto('/diaper');
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		// 3. Check statistics
		await page.goto('/statistics');

		// The "no data" message should be gone
		await expect(page.getByTestId('no-data-message')).not.toBeVisible();

		// Feeding and Diaper sections should be visible
		await expect(
			page.getByRole('heading', { name: 'Feeding', exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Diaper', exact: true }),
		).toBeVisible();

		// Stats cards should be present
		const statsCards = page.getByTestId('stats-card');
		await expect(statsCards).not.toHaveCount(0);
	});

	test('should filter data by time range', async ({ page }) => {
		// Add some data (as done in previous test, but we need it here too since tests should be independent)
		await page.goto('/diaper');
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		await page.goto('/statistics');
		await expect(
			page.getByRole('heading', { name: 'Diaper', exact: true }),
		).toBeVisible();

		// Change time range to "Last 7 Days" (which is default, but let's re-select or change to something else)
		// Actually, let's try to select "All Data"
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: 'All Data' }).click();

		await expect(
			page.getByRole('heading', { name: 'Diaper', exact: true }),
		).toBeVisible();
	});
});
