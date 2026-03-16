import { format, subDays } from 'date-fns';
import { expect, test } from './fixtures/test';

test.describe('History Filtering', () => {
	test('should filter diaper changes by date range', async ({ page }) => {
		await page.goto('/diaper');

		// Wait for the page to be interactive
		await expect(page.getByRole('button', { name: 'Add Entry' })).toBeVisible();

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
		await page
			.getByLabel('Date', { exact: true })
			.fill(format(yesterday, 'yyyy-MM-dd'));
		await page
			.getByLabel('Time', { exact: true })
			.fill(format(yesterday, 'HH:mm'));
		await page.getByRole('button', { name: 'Save' }).click();

		// Add urine entry for two days ago
		await page.getByRole('button', { name: 'Urine' }).click();
		await page.getByLabel('Notes').fill('Two days ago entry');
		await page
			.getByLabel('Date', { exact: true })
			.fill(format(twoDaysAgo, 'yyyy-MM-dd'));
		await page
			.getByLabel('Time', { exact: true })
			.fill(format(twoDaysAgo, 'HH:mm'));
		await page.getByRole('button', { name: 'Save' }).click();

		// Verify all 3 are visible initially (default last 7 days)
		await expect(page.getByText('Today entry')).toBeVisible();
		await expect(page.getByText('Yesterday entry')).toBeVisible();
		await expect(page.getByText('Two days ago entry')).toBeVisible();

		// Open timeframe selector
		await page.getByRole('button', { name: 'Select Timeframe' }).click();

		// Set range to just yesterday
		await page.locator('#from').fill(format(yesterday, 'yyyy-MM-dd'));
		await page.locator('#to').fill(format(yesterday, 'yyyy-MM-dd'));
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
		await page.getByRole('link', { name: 'Clear Filter' }).click();

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
		await expect(page.getByRole('button', { name: 'Add Entry' })).toBeVisible();
		await page.getByRole('button', { name: 'Add Entry' }).click();
		await page.getByLabel('Title').fill('Test Event');
		await page.getByTestId('period-event-radio').click();
		await page.getByTestId('has-end-date-switch').click();
		await page.locator('#start-date').fill(format(startDate, 'yyyy-MM-dd'));
		await page.locator('#end-date').fill(format(endDate, 'yyyy-MM-dd'));
		await page.getByRole('button', { name: 'Save' }).click();

		// Click menu on the event
		await page.getByTestId('history-entry-actions').first().click();

		// Click "Show Diaper Changes"
		await page.getByRole('menuitem', { name: 'Show Diaper Changes' }).click();

		// Verify navigation and filter
		await expect(page).toHaveURL(/\/diaper\?from=.*&to=.*&event=Test%20Event/);
		await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
	});
});
