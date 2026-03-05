import { addDays, format } from 'date-fns';
import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';

test.describe('Statistics Custom Range and Comparison', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should allow selecting a custom range and show comparison automatically', async ({
		page,
	}) => {
		await addManualFeedingEntry(page, {
			date: format(new Date(), 'yyyy-MM-dd'),
			minutes: 10,
		});

		for (const days of [9, 10]) {
			await addManualFeedingEntry(page, {
				date: format(addDays(new Date(), -days), 'yyyy-MM-dd'),
				minutes: 15,
			});
		}

		await page.goto('/statistics');

		const totalFeedingsCard = page.locator(
			'[data-testid="stats-card"]:has-text("Total Feedings")',
		);
		await expect(totalFeedingsCard.locator('.text-2xl')).toHaveText('1');
		await expect(totalFeedingsCard.locator('text=↓50%').first()).toBeVisible();

		const comparisonLabel = page.getByText(/Comparing to:/);
		await expect(comparisonLabel).toBeVisible();

		await page.getByRole('combobox').click({ force: true });
		await page
			.getByRole('option', { name: 'Custom Range' })
			.click({ force: true });

		const fromDate = format(addDays(new Date(), -14), 'yyyy-MM-dd');
		const toDate = format(new Date(), 'yyyy-MM-dd');

		await page.locator('input#from').fill(fromDate, { force: true });
		await page.locator('input#to').fill(toDate, { force: true });

		await expect(totalFeedingsCard.locator('.text-2xl')).toHaveText('3');

		await expect(totalFeedingsCard.locator('text=↓50%')).not.toBeVisible();
	});
});
