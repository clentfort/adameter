import { expect, test } from '@playwright/test';

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
		await page.getByRole('button', { name: 'Add Entry' }).click();

		// Fill the form
		// Selecting "Right Breast" in the dialog
		await page.getByLabel('Right Breast').check();
		await page.getByLabel('minutes').fill('15');

		// Save
		await page.getByRole('button', { name: 'Save' }).click();

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
		// First, add an entry to edit
		await page.getByRole('button', { name: 'Add Entry' }).click();
		await page.getByLabel('minutes').fill('10');
		await page.getByRole('button', { name: 'Save' }).click();

		// Wait for the entry to appear
		await expect(page.getByText('10 min', { exact: true })).toBeVisible();

		// Find and click edit button in history
		await page.getByRole('button', { name: 'Edit' }).first().click();

		// Modify duration
		await page.getByLabel('minutes').fill('20');
		await page.getByRole('button', { name: 'Save' }).click();

		// Verify update
		await expect(page.getByText('20 min', { exact: true })).toBeVisible();
		await expect(page.getByText('10 min', { exact: true })).not.toBeVisible();
	});

	test('should delete a feeding entry', async ({ page }) => {
		// First, add an entry to delete
		await page.getByRole('button', { name: 'Add Entry' }).click();
		await page.getByLabel('minutes').fill('5');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect(page.getByText('5 min', { exact: true })).toBeVisible();

		// Click delete button in history
		await page.getByRole('button', { name: 'Delete' }).first().click();

		// Confirm deletion
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Delete' })
			.click();

		// Verify removal
		await expect(page.getByText('5 min', { exact: true })).not.toBeVisible();
	});
});
