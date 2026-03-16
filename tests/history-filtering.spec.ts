import { expect, test } from '@playwright/test';
import { format, subDays } from 'date-fns';

test.describe('History Filtering', () => {
	test('should filter diaper changes by date range', async ({ page }) => {
		await page.goto('/diaper');

		// Wait for the app to load and dismiss any prompts
		await page.waitForSelector('text=Diaper Changes');

		// Create a few entries for different days
		const today = new Date();
		const yesterday = subDays(today, 1);
		const twoDaysAgo = subDays(today, 2);

		// Add urine entry for today
		await page.getByRole('button', { name: 'Urine' }).click();
		await page.getByLabel('Notes').fill('Today entry');
		await page.getByRole('button', { name: 'Save' }).click();

		// Add urine entry for yesterday
		await page.getByRole('button', { name: 'Urine' }).click();
		await page.getByLabel('Notes').fill('Yesterday entry');
		// Manually set date to yesterday
		await page.getByLabel('Time').fill(format(yesterday, "yyyy-MM-dd'T'HH:mm"));
		await page.getByRole('button', { name: 'Save' }).click();

		// Add urine entry for two days ago
		await page.getByRole('button', { name: 'Urine' }).click();
		await page.getByLabel('Notes').fill('Two days ago entry');
		await page.getByLabel('Time').fill(format(twoDaysAgo, "yyyy-MM-dd'T'HH:mm"));
		await page.getByRole('button', { name: 'Save' }).click();

		// Verify all 3 are visible initially (default last 7 days)
		await expect(page.getByText('Today entry')).toBeVisible();
		await expect(page.getByText('Yesterday entry')).toBeVisible();
		await expect(page.getByText('Two days ago entry')).toBeVisible();

		// Open timeframe selector
		await page.getByRole('button', { name: 'Select Timeframe' }).click();

		// Set range to just yesterday
		await page.getByLabel('From').fill(format(yesterday, 'yyyy-MM-dd'));
		await page.getByLabel('To').fill(format(yesterday, 'yyyy-MM-dd'));
		await page.getByRole('button', { name: 'Apply' }).click();

		// Verify popover closed
		await expect(page.getByRole('button', { name: 'Apply' })).not.toBeVisible();

		// Verify filter is applied
		await expect(page.getByText('Yesterday entry')).toBeVisible();
		await expect(page.getByText('Today entry')).not.toBeVisible();
		await expect(page.getByText('Two days ago entry')).not.toBeVisible();

		// Verify filter indicator is visible
		await expect(page.getByText('Viewing filtered timeframe')).toBeVisible();

		// Clear filter
		await page.getByRole('button', { name: 'Clear Filter' }).click();

		// Verify all entries visible again
		await expect(page.getByText('Today entry')).toBeVisible();
		await expect(page.getByText('Yesterday entry')).toBeVisible();
		await expect(page.getByText('Two days ago entry')).toBeVisible();
	});

	test('should navigate from events to filtered history', async ({ page }) => {
		await page.goto('/events');

		const today = new Date();
		const startDate = subDays(today, 2);
		const endDate = subDays(today, 1);

		// Create an event
		await page.getByRole('button', { name: 'Add Entry' }).click();
		await page.getByLabel('Title').fill('Test Event');
		await page.getByLabel('Start Date').fill(format(startDate, 'yyyy-MM-dd'));
		await page.getByLabel('End Date').fill(format(endDate, 'yyyy-MM-dd'));
		await page.getByRole('button', { name: 'Save' }).click();

		// Click menu on the event
		await page.getByRole('button', { name: 'More options' }).first().click();

		// Click "Show Diaper Changes"
		await page.getByRole('menuitem', { name: 'Show Diaper Changes' }).click();

		// Verify navigation and filter
		await expect(page).toHaveURL(/\/diaper\?from=.*&to=.*&event=Test%20Event/);
		await expect(
			page.getByText('Viewing related activity for Test Event'),
		).toBeVisible();
	});
});
