import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { createRoom, joinRoom } from './helpers/rooms';

test.describe('Room management', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should allow creating a room', async ({ page }) => {
		const roomName = await createRoom(page);
		await expect(page.getByText(/currently connected to:/i)).toBeVisible();
		expect(roomName.split('-')).toHaveLength(3);
	});

	test('should allow joining a room', async ({ page }) => {
		const testRoom = 'test-room-name';
		await page.goto('/settings');
		await page.getByTestId('settings-sharing').click();
		await page.getByRole('tab', { name: /join room|raum beitreten/i }).click();
		await page.getByPlaceholder(/(?:predicate-){2}object/i).fill(testRoom);
		await page
			.getByRole('button', { name: /join|beitreten/i })
			.first()
			.click();
		await expect(page.getByText(/you are about to join room/i)).toBeVisible();
		await page
			.getByRole('button', { name: /merge & join|zusammenführen/i })
			.click();

		await expect(page.getByText(/currently connected to:/i)).toBeVisible();
		await expect(page.getByTestId('settings-room-name')).toHaveText(testRoom);
	});

	test('should handle invite link with warning if already in a room', async ({
		page,
	}) => {
		await createRoom(page);
		await expect(page.getByText(/currently connected to:/i)).toBeVisible();

		await page.goto('/?room=new-test-room');

		await expect(page.getByText(/leave current room\?/i)).toBeVisible();
		await page.getByRole('button', { name: /leave room/i }).click();

		await expect(page.getByText(/you are about to join room/i)).toBeVisible();
		await expect(page.getByText('new-test-room')).toBeVisible();
	});

	test('should keep feeding data after creating a room', async ({ page }) => {
		await addManualFeedingEntry(page, { breast: 'right', minutes: 15 });

		await createRoom(page);
		await expect(page.getByTestId('settings-room-name')).toBeVisible();

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
		await addManualFeedingEntry(page, { breast: 'right', minutes: 15 });

		const roomName = `room-merge-regression-${Date.now()}`;
		await joinRoom(page, roomName);

		await page.goto('/feeding');
		await expect(page.getByText('15 min', { exact: true })).toBeVisible();
		await expect(
			page.getByTestId('feeding-history-entry').getByText('Right Breast', {
				exact: true,
			}),
		).toBeVisible();
	});
});
