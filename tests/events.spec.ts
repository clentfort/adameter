import { expect, test } from '@playwright/test';

test.describe('Events Page', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			window.localStorage.setItem('adameter-skip-profile', 'true');
		});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/events');
	});

	test('should add a point in time event', async ({ page }) => {
		await page.getByRole('button', { name: 'Add Entry' }).click();

		// Fill the form
		await page.getByLabel('Title').fill('Vaccination', { force: true });
		await page
			.getByLabel('Description (optional)')
			.fill('First round of shots', { force: true });
		await page.getByTestId('point-event-radio').click({ force: true });

		// Save
		await page.getByTestId('save-button').click({ force: true });

		// Verify in history
		const entry = page.getByTestId('event-entry').first();
		await expect(entry.getByText('Vaccination')).toBeVisible();
		await expect(entry.getByText('First round of shots')).toBeVisible();
	});

	test('should add a period event', async ({ page }) => {
		await page.getByRole('button', { name: 'Add Entry' }).click();

		// Fill the form
		await page.getByLabel('Title').fill('Illness', { force: true });
		await page.getByTestId('period-event-radio').click({ force: true });
		await page.getByTestId('has-end-date-switch').click({ force: true });

		// Save
		await page.getByTestId('save-button').click({ force: true });

		// Verify in history
		const entry = page.getByTestId('event-entry').first();
		await expect(entry.getByText('Illness')).toBeVisible();
	});

	test('should edit an event', async ({ page }) => {
		// First, add an entry to edit
		await page.getByRole('button', { name: 'Add Entry' }).click();
		await page.getByLabel('Title').fill('Original Event', { force: true });
		await page
			.getByRole('dialog')
			.getByRole('button', { name: 'Save' })
			.click({ force: true });

		await expect(page.getByText('Original Event')).toBeVisible();

		// Edit it
		await page.getByRole('button', { name: 'Edit' }).first().click();
		await page.getByLabel('Title').fill('Updated Event', { force: true });
		await page.getByTestId('save-button').click({ force: true });

		// Verify update
		await expect(page.getByText('Updated Event')).toBeVisible();
		await expect(page.getByText('Original Event')).not.toBeVisible();
	});

	test('should delete an event', async ({ page }) => {
		// First, add an entry to delete
		await page.getByRole('button', { name: 'Add Entry' }).click();
		await page.getByLabel('Title').fill('To be deleted', { force: true });
		await page.getByTestId('save-button').click({ force: true });

		await expect(page.getByText('To be deleted')).toBeVisible();

		// Delete it
		await page.getByRole('button', { name: 'Delete' }).first().click();
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Delete' })
			.click({ force: true });

		// Verify removal
		await expect(page.getByTestId('event-entry')).not.toBeVisible();
	});
});
