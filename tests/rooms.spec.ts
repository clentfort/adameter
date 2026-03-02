import { expect, test } from '@playwright/test';

test.describe('Room management', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			window.localStorage.setItem('adameter-skip-profile', 'true');
		});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should allow creating a room', async ({ page }) => {
		await page.getByRole('button', { name: /settings|einstellungen/i }).click();
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /create room/i }).click();
		await page.getByRole('button', { name: /create new room/i }).click();

		// After creation, verify room name is visible
		await expect(page.getByText(/currently connected to:/i)).toBeVisible();

		// Room name should be 3 words separated by hyphens
		const roomName = await page.locator('.room-name').textContent();
		expect(roomName?.trim().split('-')).toHaveLength(3);
	});

	test('should allow joining a room', async ({ page }) => {
		const testRoom = 'test-room-name';
		await page.getByRole('button', { name: /settings|einstellungen/i }).click();
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /join room/i }).click();
		await page.getByPlaceholder(/(?:predicate-){2}object/i).fill(testRoom);
		await page.getByRole('button', { name: /join/i }).first().click();

		// Should show join dialog
		await expect(page.getByText(/you are about to join room/i)).toBeVisible();
		await page.getByRole('button', { name: /merge & join/i }).click();

		// Verify connection
		await expect(page.getByText(/currently connected to:/i)).toBeVisible();
		await expect(page.locator('.room-name')).toHaveText(testRoom);
	});

	test('should preserve data when creating a room with merge strategy', async ({
		page,
	}) => {
		// 1. Add some data
		await page.getByRole('link', { name: /feeding|füttern/i }).click();
		await page.getByRole('button', { name: /add entry|eintrag hinzufügen/i }).click();
		await page.getByLabel(/duration|dauer/i).fill('10');
		await page.getByRole('button', { name: /save|speichern/i }).click();
		await expect(page.getByText(/10\s*min/i)).toBeVisible();

		// 2. Create a room (defaults to merge)
		await page.getByRole('button', { name: /settings|einstellungen/i }).click();
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /create room/i }).click();
		await page.getByRole('button', { name: /create new room/i }).click();

		// 3. Verify room is connected
		await expect(page.getByText(/currently connected to:/i)).toBeVisible();

		// 4. Go back to feeding and verify data is still there
		await page.getByTestId('back-button').click(); // Back to main settings
		await page.getByTestId('back-button').click(); // Back to dashboard
		await page.getByRole('link', { name: /feeding|füttern/i }).click();
		await expect(page.getByText(/10\s*min/i)).toBeVisible();
	});

	test('should handle invite link with warning if already in a room', async ({
		page,
	}) => {
		// Join a room first
		await page.getByRole('button', { name: /settings|einstellungen/i }).click();
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /create room/i }).click();
		await page.getByRole('button', { name: /create new room/i }).click();
		// Ensure room is created
		await expect(page.getByText(/currently connected to:/i)).toBeVisible();

		// Navigate to another room via URL
		await page.goto('/?room=new-test-room');

		// Should show warning dialog
		await expect(page.getByText(/leave current room\?/i)).toBeVisible();
		await page.getByRole('button', { name: /leave room/i }).click();

		// Should show join dialog
		await expect(page.getByText(/you are about to join room/i)).toBeVisible();
		await expect(page.getByText('new-test-room')).toBeVisible();
	});
});
