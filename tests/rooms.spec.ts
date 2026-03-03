import { expect, test } from '@playwright/test';

async function addFeedingEntry(page: import('@playwright/test').Page) {
	await page.goto('/feeding');
	await page.getByRole('button', { name: 'Add Entry' }).click();
	await page.getByTestId('right-breast-radio').click({ force: true });
	await page.getByLabel('minutes').fill('15', { force: true });
	await page.getByRole('button', { name: 'Save' }).click({ force: true });
	await expect(page.getByText('15 min', { exact: true })).toBeVisible();
}

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

	test('should keep feeding data after creating a room', async ({ page }) => {
		await addFeedingEntry(page);

		await page.goto('/settings');
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /create room/i }).click();
		await page.getByRole('button', { name: /create new room/i }).click();
		await expect(page.locator('.room-name')).toBeVisible();

		await page.goto('/feeding');
		await expect(page.getByText('15 min', { exact: true })).toBeVisible();
		await expect(
			page.getByTestId('feeding-history-entry').getByText('Right Breast', {
				exact: true,
			}),
		).toBeVisible();
	});

	test('should keep feeding data after joining a room with merge', async ({
		page,
	}) => {
		await addFeedingEntry(page);

		const roomName = `room-merge-regression-${Date.now()}`;
		await page.goto('/settings');
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /join room/i }).click();
		await page.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomName);
		await page.getByRole('button', { name: /join/i }).first().click();
		await page.getByRole('button', { name: /merge & join/i }).click();
		await expect(page.locator('.room-name')).toHaveText(roomName);

		await page.goto('/feeding');
		await expect(page.getByText('15 min', { exact: true })).toBeVisible();
		await expect(
			page.getByTestId('feeding-history-entry').getByText('Right Breast', {
				exact: true,
			}),
		).toBeVisible();
	});
});
