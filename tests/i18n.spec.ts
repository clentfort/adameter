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
		await page.getByRole('button', { name: /Settings|Einstellungen/ }).click();
		await page.getByTestId('settings-appearance').click();
		await page.getByRole('combobox').first().click();
		await page.getByRole('option', { name: 'German' }).click();

		// 3. Verify German text
		// Wait for the select to close and any re-renders
		await page.waitForTimeout(500);
		await page.getByTestId('back-button').click();
		// Wait for the main settings to show up before clicking back again
		await expect(
			page.getByRole('button', { name: /Appearance|Erscheinungsbild/ }),
		).toBeVisible();
		await page.getByTestId('back-button').click();
		await expect(page.getByText('Letztes Stillen')).toBeVisible();

		// 4. Reload and verify German is persisted
		await page.reload();
		await expect(page.getByText('Letztes Stillen')).toBeVisible();

		// 5. Switch back to English
		// In German, the title is translated to "Settings" (since translation is missing)
		await page.getByRole('button', { name: /Settings|Einstellungen/ }).click();
		await page.getByTestId('settings-appearance').click();
		await page.getByRole('combobox').first().click();
		await page.getByRole('option', { name: /English|Englisch/ }).click();

		// 6. Go back to home and verify English text again
		await page.waitForTimeout(500);
		await page.getByTestId('back-button').click();
		await page.getByTestId('back-button').click();
		await expect(page.getByText('Last Feeding')).toBeVisible();
	});
});
