import { expect, test } from '@playwright/test';
import { addDays, format } from 'date-fns';

test.describe('Statistics Custom Range and Comparison', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should allow selecting a custom range and show comparison automatically', async ({
		page,
	}) => {
		// Add some feeding data for today (Primary period)
		await page.goto('/feeding');
		await page.getByRole('button', { name: 'Add Entry' }).click({ force: true });
		await page
			.locator('input[type="date"]')
			.fill(format(new Date(), 'yyyy-MM-dd'), { force: true });
		await page.locator('input[type="number"]').fill('10', { force: true });
		await page.getByTestId('save-button').click({ force: true });
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Add 2 feedings in the comparison period (8-14 days ago for "Last 7 Days")
		for (const days of [9, 10]) {
			await page.getByRole('button', { name: 'Add Entry' }).click({ force: true });
			await page
				.locator('input[type="date"]')
				.fill(format(addDays(new Date(), -days), 'yyyy-MM-dd'), { force: true });
			await page.locator('input[type="number"]').fill('15', { force: true });
			await page.getByTestId('save-button').click({ force: true });
			await expect(page.getByRole('dialog')).not.toBeVisible();
		}

		await page.goto('/statistics');

		// Default is Last 7 Days.
		// Primary range (last 7 days): 1 feeding (today)
		// Comparison range (previous 7 days): 2 feedings
		// Change = (1-2)/2 = -50%

		const totalFeedingsCard = page.locator(
			'[data-testid="stats-card"]:has-text("Total Feedings")',
		);
		await expect(totalFeedingsCard.locator('.text-2xl')).toHaveText('1');
		await expect(totalFeedingsCard.locator('text=↓50%').first()).toBeVisible();

		// Verify comparison timeframe is shown
		const comparisonLabel = page.getByText(/Comparing to:/);
		await expect(comparisonLabel).toBeVisible();

		// Select Custom Range
		await page.getByRole('combobox').click({ force: true });
		await page
			.getByRole('option', { name: 'Custom Range' })
			.click({ force: true });

		// Set range to include all 3 (last 15 days)
		const fromDate = format(addDays(new Date(), -14), 'yyyy-MM-dd');
		const toDate = format(new Date(), 'yyyy-MM-dd');

		await page.locator('input#from').fill(fromDate, { force: true });
		await page.locator('input#to').fill(toDate, { force: true });

		// Now should see 3 feedings in primary range
		await expect(totalFeedingsCard.locator('.text-2xl')).toHaveText('3');

		// The comparison period for a 15-day range will be the 15 days before that.
		// We have no data there, so comparison should not show percentage change.
		await expect(totalFeedingsCard.locator('text=↓50%')).not.toBeVisible();
	});
});
