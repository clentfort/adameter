import { expect, test } from './fixtures/test';

test.describe('Internationalization', () => {
	test('should switch language from English to German and back', async ({
		page,
	}) => {
		await page.goto('/');

		// 1. Verify default English
		await expect(page.getByText('Last Feeding')).toBeVisible();

		// 2. Switch to German
		await page.getByTestId('settings-button').click();
		await page.getByTestId('settings-appearance').click();
		await page.getByRole('combobox').first().click();
		await page.getByRole('option', { name: 'German' }).click();

		// 3. Verify German text
		await page.getByTestId('back-button').click();
		// Wait for the main settings hub
		await expect(page.getByTestId('settings-appearance')).toBeVisible();
		await page.getByTestId('back-button').click();
		await expect(page.getByText('Letztes Stillen')).toBeVisible();

		// 4. Reload and verify German is persisted
		await page.reload();
		await expect(page.getByText('Letztes Stillen')).toBeVisible();

		// 5. Switch back to English
		await page.getByTestId('settings-button').click();
		await page.getByTestId('settings-appearance').click();
		await page.getByRole('combobox').first().click();
		await page.getByRole('option', { name: /English|Englisch/ }).click();

		// 6. Go back to home and verify English text again
		await page.getByTestId('back-button').click();
		// Wait for the main settings hub
		await expect(page.getByTestId('settings-appearance')).toBeVisible();
		await page.getByTestId('back-button').click();
		await expect(page.getByText('Last Feeding')).toBeVisible();
	});
});
