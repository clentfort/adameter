import { expect, test } from './fixtures/test';
import { addManualFeedingEntry, addTimerFeedingEntry } from './helpers/feeding';

test.describe('Statistics Page', () => {
	test('should show no data message when app is empty', async ({ page }) => {
		await page.goto('/statistics');
		await expect(page.getByTestId('no-data-message')).toBeVisible();
		await expect(
			page.getByText('No data available for the selected time range.'),
		).toBeVisible();
	});

	test('should show statistics after adding data', async ({ page }) => {
		await addTimerFeedingEntry(page, 'left');

		await page.goto('/diaper');
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		await page.goto('/statistics');

		await expect(page.getByTestId('no-data-message')).not.toBeVisible();

		await expect(
			page.getByRole('heading', { exact: true, name: 'Feeding' }),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper & Potty' }),
		).toBeVisible();

		const statsCards = page.getByTestId('stats-card');
		await expect(statsCards).not.toHaveCount(0);

		await expect(page.getByText('Total Feedings')).toBeVisible();
		await expect(page.getByText('Feedings Per Day')).toBeVisible();

		await expect(page.getByText('Average Feeding Duration')).toBeVisible();
	});

	test('should show feeding statistics correctly', async ({ page }) => {
		await addManualFeedingEntry(page, { breast: 'left', minutes: 10 });
		await addManualFeedingEntry(page, { breast: 'right', minutes: 15 });

		await page.goto('/statistics');

		await expect(
			page.getByRole('heading', { exact: true, name: 'Feeding' }),
		).toBeVisible();

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
			page.getByRole('heading', { exact: true, name: 'Diaper & Potty' }),
		).toBeVisible();

		// Verify specific diaper metrics
		await expect(page.getByText('Total Changes')).toBeVisible();
		await expect(page.getByText('Avg Changes / Day')).toBeVisible();
	});

	test('should filter data by time range', async ({ page }) => {
		// Add some data (as done in previous test, but we need it here too since tests should be independent)
		await page.goto('/diaper');
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		await page.goto('/statistics');
		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper & Potty' }),
		).toBeVisible();

		// Change time range to "Last 7 Days" (which is default, but let's re-select or change to something else)
		// Actually, let's try to select "All Data"
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: 'All Data' }).click();

		await expect(
			page.getByRole('heading', { exact: true, name: 'Diaper & Potty' }),
		).toBeVisible();
	});
});
