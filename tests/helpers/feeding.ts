import type { Page } from '@playwright/test';
import { expect } from '../fixtures/test';

const breastSelectors = {
	left: 'left-breast-radio',
	right: 'right-breast-radio',
} as const;

interface ManualFeedingEntryOptions {
	breast?: keyof typeof breastSelectors;
	date?: string;
	minutes?: number;
}

export async function addManualFeedingEntry(
	page: Page,
	options: ManualFeedingEntryOptions = {},
) {
	const { breast = 'right', date, minutes = 15 } = options;

	await page.goto('/feeding');
	await page.getByRole('button', { name: 'Add Entry' }).click();
	await page.getByTestId(breastSelectors[breast]).click({ force: true });

	if (date) {
		await page.getByLabel('Date').fill(date, { force: true });
	}

	await page.getByLabel('Duration (minutes)').fill(String(minutes), {
		force: true,
	});
	await page.getByRole('button', { name: 'Save' }).click({ force: true });
	await expect(page.getByRole('dialog')).not.toBeVisible();

	// Wait for the history entry to be visible, might need to clear filters if added in the past
	const entry = page
		.getByTestId('feeding-history-entry')
		.filter({ hasText: `${minutes} min` })
		.first();

	// Wait for the history entry to be visible, might need to clear filters or expand list
	await expect(async () => {
		if (await entry.isVisible()) return;

		const clearButton = page.getByRole('link', { name: 'Clear Filter' });
		if (await clearButton.isVisible()) {
			await clearButton.click();
		}

		const showOlder = page.getByRole('button', { name: 'Show older entries' });
		if (await showOlder.isVisible()) {
			await showOlder.click();
		}

		const showNewer = page.getByRole('button', { name: 'Show newer entries' });
		if (await showNewer.isVisible()) {
			await showNewer.click();
		}

		expect(await entry.isVisible()).toBeTruthy();
	}).toPass({ timeout: 10_000 });
}

export async function addTimerFeedingEntry(
	page: Page,
	breast: 'left' | 'right' = 'left',
) {
	await page.goto('/feeding');
	await page
		.getByRole('button', {
			name: breast === 'left' ? 'Left Breast' : 'Right Breast',
		})
		.click();
	await expect(page.getByRole('button', { name: 'End Feeding' })).toBeVisible();
	await page.getByRole('button', { name: 'End Feeding' }).click();
}
