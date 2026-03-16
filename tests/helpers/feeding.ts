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

	// Wait for the history entry to be visible, might need to clear filters if added in the past
	const entry = page
		.getByTestId('feeding-history-entry')
		.filter({ hasText: `${minutes} min` })
		.first();

	if (!(await entry.isVisible())) {
		const clearButton = page.getByTitle('Clear filter');
		if (await clearButton.isVisible()) {
			await clearButton.click();
		}
		const showOlder = page.getByRole('button', { name: 'Show older entries' });
		while (await showOlder.isVisible()) {
			await showOlder.click();
		}
		const showNewer = page.getByRole('button', { name: 'Show newer entries' });
		while (await showNewer.isVisible()) {
			await showNewer.click();
		}
	}

	await expect(entry).toBeVisible();
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
