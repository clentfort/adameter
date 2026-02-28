import { expect, test } from '@playwright/test';

test.describe('Statistics Page', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			window.localStorage.setItem('adameter-skip-profile', 'true');
		});
	});

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
			page.getByRole('heading', { exact: true, name: 'Feeding' }),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper' }),
		).toBeVisible();

		// Stats cards should be present
		const statsCards = page.getByTestId('stats-card');
		await expect(statsCards).not.toHaveCount(0);

		// Check for specific diaper stats to ensure DiaperStats didn't crash
		// We use .first() because "Total" might appear in multiple sections (Diaper, Potty Successes)
		await expect(
			page.getByText('Total', { exact: true }).first(),
		).toBeVisible();
		await expect(page.getByText('Per Day', { exact: true }).first()).toBeVisible();

		// Check for specific feeding stats
		await expect(page.getByText('Average Feeding Duration')).toBeVisible();
	});

	test('should show feeding statistics correctly', async ({ page }) => {
		// 1. Add two feeding sessions to have "Time Between Feedings"
		await page.goto('/feeding');
		await page.getByRole('button', { name: 'Left Breast' }).click();
		await page.waitForTimeout(1000);
		await page.getByRole('button', { name: 'End Feeding' }).click();

		await page.waitForTimeout(1000);
		await page.getByRole('button', { name: 'Right Breast' }).click();
		await page.waitForTimeout(1000);
		await page.getByRole('button', { name: 'End Feeding' }).click();

		// 2. Check statistics
		await page.goto('/statistics');

		await expect(
			page.getByRole('heading', { exact: true, name: 'Feeding' }),
		).toBeVisible();

		// Verify specific feeding metrics
		await expect(page.getByText('Average Feeding Duration')).toBeVisible();
		await expect(page.getByText('Total Feeding Duration')).toBeVisible();
		await expect(page.getByText('Time Between Feedings')).toBeVisible();
	});

	test('should show diaper statistics correctly and not crash', async ({
		page,
	}) => {
		// 1. Add a diaper change
		await page.goto('/diaper');
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		// 2. Check statistics
		await page.goto('/statistics');

		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper' }),
		).toBeVisible();

		// Verify specific diaper metrics
		await expect(
			page.getByText('Total', { exact: true }).first(),
		).toBeVisible();
		await expect(
			page.getByText('Per Day', { exact: true }).first(),
		).toBeVisible();
		await expect(page.getByText('Urine Only')).toBeVisible();
	});

	test('should filter data by time range', async ({ page }) => {
		// Add some data (as done in previous test, but we need it here too since tests should be independent)
		await page.goto('/diaper');
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		await page.goto('/statistics');
		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper' }),
		).toBeVisible();

		// Change time range to "Last 7 Days" (which is default, but let's re-select or change to something else)
		// Actually, let's try to select "All Data"
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: 'All Data' }).click();

		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper' }),
		).toBeVisible();
	});
});
