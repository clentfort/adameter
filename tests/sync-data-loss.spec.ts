import { expect, test } from './fixtures/test';
import {
	createRoomAndJoinPeer,
	createRoomSyncSession,
} from './helpers/room-sync';

test.describe('Sync Data Loss', () => {
	test('data added on one device must survive after the other device syncs new data', async ({
		browser,
	}) => {
		test.setTimeout(90_000);
		const session = await createRoomSyncSession(browser);
		const { pageA, pageB } = session;

		try {
			// --- Setup: two devices sharing a room ---
			await createRoomAndJoinPeer(session);

			// Device A adds a feeding entry so the remote store is non-empty.
			await pageA.goto('/feeding');
			await pageA.getByRole('button', { name: 'Left Breast' }).click();
			await pageA.getByRole('button', { name: 'End Feeding' }).click();
			await expect(pageA.getByText('Left Breast')).toHaveCount(2);

			// Device B confirms the feeding entry arrived via sync.
			await pageB.goto('/feeding');
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 30_000,
			});

			// --- Device B adds a diaper entry ---
			await pageB.goto('/diaper');
			await expect(pageB.getByTestId('quick-urine-button')).toBeVisible();
			await pageB.getByTestId('quick-urine-button').click();
			await pageB.getByRole('button', { name: 'Save' }).click();

			// The diaper entry should be visible on Device B.
			await expect(
				pageB
					.getByTestId('diaper-history-entry')
					.getByText('Urine', { exact: true }),
			).toBeVisible();

			// --- Device A adds another feeding entry concurrently ---
			await pageA.getByRole('button', { name: 'Right Breast' }).click();
			await pageA.getByRole('button', { name: 'End Feeding' }).click();

			// Wait for sync to settle.
			await pageA.waitForTimeout(5000);

			// --- Verify: Device B's diaper entry must still be present ---
			await expect(
				pageB
					.getByTestId('diaper-history-entry')
					.getByText('Urine', { exact: true }),
			).toBeVisible();

			// --- Verify: Device A sees the diaper entry from Device B ---
			await pageA.goto('/diaper');
			await expect(
				pageA
					.getByTestId('diaper-history-entry')
					.getByText('Urine', { exact: true }),
			).toBeVisible({ timeout: 30_000 });

			// --- Verify: Device B sees both feeding entries from Device A ---
			await pageB.goto('/feeding');
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 30_000,
			});
			await expect(pageB.getByText('Right Breast')).toHaveCount(2, {
				timeout: 30_000,
			});
		} finally {
			await session.close();
		}
	});
});
