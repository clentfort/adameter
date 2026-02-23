import { expect, test } from '@playwright/test';

test.describe('Child Profile', () => {
	test('can set up profile and edit it later', async ({ page }) => {
		await page.goto('/');

		// 1. Initial setup
		await expect(page.getByText('Welcome to AdaMeter!')).toBeVisible();

		await page.getByLabel(/Name/).fill('Baby Ada');
		await page.getByLabel(/Date of Birth/).fill('2024-01-01');
		await page.getByLabel(/Sex/).click();
		await page.getByRole('option', { name: 'Girl' }).click();

		// Click a color (e.g., Pink)
		await page.locator('.bg-pink-500').click();

		await page.getByRole('button', { name: 'Save Profile' }).click();

		// Check that the prompt is gone
		await expect(page.getByText('Welcome to AdaMeter!')).not.toBeVisible();

		// 2. Edit profile in settings
		await page.getByRole('button', { name: /settings/i }).click();
		await page.getByTestId('settings-profile').click();

		// Verify initial data
		await expect(page.getByLabel(/Name/)).toHaveValue('Baby Ada');
		await expect(page.getByLabel(/Date of Birth/)).toHaveValue('2024-01-01');

		// Change name and color
		await page.getByLabel(/Name/).fill('Ada Lovelace');
		await page.locator('.bg-blue-500').click();
		await page.getByRole('button', { name: 'Save Profile' }).click();

		// Should be back to main settings
		await expect(page.getByRole('button', { name: /Ada Lovelace|Profile|Profil/ })).toBeVisible();
		await expect(page.getByText('Ada Lovelace')).toBeVisible();

		// 3. Verify it persists across reloads
		await page.goto('/');
		// Wait for app to be ready
		await expect(page.getByText('AdaMeter')).toBeVisible();
		// Wait for profile prompt to be gone (if it appeared briefly)
		await expect(page.getByText('Welcome to AdaMeter!')).not.toBeVisible();
		await page.getByRole('button', { name: /settings/i }).click();
		await page.getByTestId('settings-profile').click();
		await expect(page.getByLabel(/Name/)).toHaveValue('Ada Lovelace');
	});

	test('profile persists when creating a room', async ({ page }) => {
		await page.goto('/');

		// Initial setup
		await page.getByLabel(/Name/).fill('Baby Ada');
		await page.getByLabel(/Date of Birth/).fill('2024-01-01');
		await page.getByLabel(/Sex/).click();
		await page.getByRole('option', { name: 'Girl' }).click();
		await page.getByRole('button', { name: 'Save Profile' }).click();

		// Create a room
		await page.getByRole('button', { name: /settings/i }).click();
		await page.getByRole('button', { name: /sharing|teilen/i }).click();
		await page.getByRole('tab', { name: /create room|raum erstellen/i }).click();
		await page.getByRole('button', { name: /create new room|neuen raum erstellen/i }).click();

		// Wait for room to be created (room name should appear)
		await expect(page.locator('p.text-xl.font-bold').filter({ hasText: /(?:[a-z]+-){2}[a-z]+/ })).toBeVisible();

		// Verify profile prompt doesn't reappear
		await page.getByTestId('back-button').click();
		await page.getByTestId('back-button').click(); // Back to home
		await expect(page.getByText('Welcome to AdaMeter!')).not.toBeVisible();

		// Check settings again to be sure
		await page.getByRole('button', { name: /settings/i }).click({ force: true });
		await page.getByTestId('settings-profile').click();
		await expect(page.getByLabel(/Name/)).toHaveValue('Baby Ada');
	});
});
