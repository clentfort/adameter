import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';

test.describe('Feeding Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/feeding');
	});

	test('should start and end a feeding session using the timer', async ({
		page,
	}) => {
		// Start feeding on left breast
		await page.getByRole('button', { name: 'Left Breast' }).click();

		// Verify timer is visible
		await expect(
			page.getByRole('button', { name: 'End Feeding' }),
		).toBeVisible();
		await expect(page.getByTestId('feeding-timer')).toBeVisible();

		// End feeding
		await page.getByRole('button', { name: 'End Feeding' }).click();

		// Verify it appears in history
		await expect(
			page.getByTestId('feeding-history-entry').getByText('Left Breast', {
				exact: true,
			}),
		).toBeVisible();
	});

	test('should manually add a feeding entry', async ({ page }) => {
		await addManualFeedingEntry(page, { breast: 'right', minutes: 15 });

		// Verify in history
		await expect(
			page.getByTestId('feeding-history-entry').getByText('Right Breast', {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page
				.getByTestId('feeding-history-entry')
				.getByText('15 min', { exact: true }),
		).toBeVisible();
	});

	test('should edit a feeding entry', async ({ page }) => {
		await addManualFeedingEntry(page, { minutes: 10 });

		await expect(page.getByText('10 min', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'Edit' }).first().click();

		await page.getByLabel('minutes').fill('20', { force: true });
		await page.getByRole('button', { name: 'Save' }).click({ force: true });

		await expect(page.getByText('20 min', { exact: true })).toBeVisible();
		await expect(page.getByText('10 min', { exact: true })).not.toBeVisible();
	});

	test('should delete a feeding entry', async ({ page }) => {
		await addManualFeedingEntry(page, { minutes: 5 });

		await expect(page.getByText('5 min', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'Delete' }).first().click();

		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Delete' })
			.click({ force: true });

		await expect(page.getByText('5 min', { exact: true })).not.toBeVisible();
	});
});
