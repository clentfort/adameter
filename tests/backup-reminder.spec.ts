import type { Page } from '@playwright/test';
import { expect, setTinyBaseRow, test } from './fixtures/test';

test.use({ showBackupReminder: true });

// The reminder only appears once something was tracked, checked on app start.
async function openAppWithTrackedEntry(page: Page) {
	await page.goto('/');
	await setTinyBaseRow(page, 'diaperChanges', 'backup-reminder-entry', {
		containsStool: false,
		containsUrine: true,
		timestamp: new Date().toISOString(),
	});
	await page.reload();
}

test.describe('Backup reminder', () => {
	test('asks for a backup and stays quiet after downloading', async ({
		page,
	}) => {
		await openAppWithTrackedEntry(page);

		await expect(page.getByText('Back up your data')).toBeVisible();

		const downloadPromise = page.waitForEvent('download');
		await page.getByTestId('backup-reminder-download').click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/^adameter-export-.*\.zip$/);
		await expect(page.getByText('Back up your data')).toBeHidden();

		await page.reload();
		await expect(page.getByTestId('settings-button')).toBeVisible();
		await expect(page.getByText('Back up your data')).toBeHidden();
	});

	test('can be switched off', async ({ page }) => {
		await openAppWithTrackedEntry(page);

		await page.getByTestId('backup-reminder-opt-out').click();
		await expect(page.getByText('Back up your data')).toBeHidden();

		await page.goto('/settings/data');
		await expect(page.getByRole('radio', { name: 'Off' })).toBeChecked();
	});
});
