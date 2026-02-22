import { expect, test } from '@playwright/test';

test.describe('Diaper Page', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			window.localStorage.setItem('adameter-skip-profile', 'true');
		});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/diaper');
	});

	test('should add a quick urine diaper change', async ({ page }) => {
		await page.getByTestId('quick-urine-button').click();

		// The tracker opens a DiaperForm dialog
		await expect(page.getByRole('dialog')).toBeVisible();
		await page.getByRole('button', { name: 'Save' }).click();

		// Verify in history
		await expect(
			page.getByTestId('diaper-history-entry').getByText('Urine', {
				exact: true,
			}),
		).toBeVisible();
	});

	test('should add a quick stool diaper change', async ({ page }) => {
		await page.getByTestId('quick-stool-button').click();

		// The tracker opens a DiaperForm dialog
		await expect(page.getByRole('dialog')).toBeVisible();
		await page.getByRole('button', { name: 'Save' }).click();

		// Verify in history
		await expect(
			page.getByTestId('diaper-history-entry').getByText('Urine & Stool', {
				exact: true,
			}),
		).toBeVisible();
	});

	test('should manually add a diaper change', async ({ page }) => {
		await page.getByRole('button', { name: 'Add Entry' }).click();

		// Fill the form
		await page.getByTestId('toggle-diaper-stool').click({ force: true });
		await page.locator('#edit-temperature').fill('37.0', { force: true });
		await page.locator('#edit-notes').fill('Normal change', { force: true });

		// Save
		await page.getByRole('button', { name: 'Save' }).click({ force: true });

		// Verify in history
		const entry = page.getByTestId('diaper-history-entry').first();
		await expect(entry.getByText('Urine & Stool')).toBeVisible();
		await expect(entry.getByText('37 °C')).toBeVisible();
		await expect(entry.getByText('Normal change')).toBeVisible();
	});

	test('should edit a diaper change', async ({ page }) => {
		// Add an entry first
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click({ force: true });

		// Wait for history to update
		await expect(page.getByTestId('diaper-history-entry')).toBeVisible();

		// Click edit button
		await page.getByRole('button', { name: 'Edit' }).first().click();

		// Change details
		await page.getByLabel('Notes').fill('Updated notes');
		await page.getByRole('button', { name: 'Save' }).click({ force: true });

		// Verify update
		await expect(page.getByText('Updated notes')).toBeVisible();
	});

	test('should delete a diaper change', async ({ page }) => {
		// Add an entry first
		await page.getByTestId('quick-urine-button').click();
		await page.getByRole('button', { name: 'Save' }).click();

		// Wait for history
		await expect(page.getByTestId('diaper-history-entry')).toBeVisible();

		// Click delete
		await page.getByRole('button', { name: 'Delete' }).first().click();

		// Confirm
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Delete' })
			.click({ force: true });

		// Verify removal
		await expect(page.getByTestId('diaper-history-entry')).not.toBeVisible();
	});
});
