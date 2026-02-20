import { expect, test } from '@playwright/test';

test.describe('Internationalization', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			window.localStorage.setItem('adameter-skip-profile', 'true');
		});
	});

	test('should switch language from English to German and back', async ({
		page,
	}) => {
		await page.goto('/');

		// 1. Verify default English
		await expect(page.getByText('Last Feeding')).toBeVisible();

		// 2. Switch to German
		await page.getByTitle('Language').click();
		await page.getByRole('menuitem').filter({ hasText: 'German' }).click();

		// 3. Verify German text
		await expect(page.getByText('Letztes Stillen')).toBeVisible();

		// 4. Reload and verify German is persisted
		await page.reload();
		await expect(page.getByText('Letztes Stillen')).toBeVisible();

		// 5. Switch back to English
		// In German, the title is translated to "Sprache" and "English" to "Englisch"
		await page.getByTitle('Sprache').click();
		await page.getByRole('menuitem').filter({ hasText: 'Englisch' }).click();

		// 6. Verify English text again
		await expect(page.getByText('Last Feeding')).toBeVisible();
	});
});
