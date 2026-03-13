import { expect, test } from './fixtures/test';
import {
	createRoomAndJoinPeer,
	createRoomSyncSession,
} from './helpers/room-sync';

test.describe('Offline Synchronization', () => {
	test('data added by Device A while Device B is offline should be visible to Device B after it comes back online, even if Device A is now offline', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { pageA, pageB, contextB } = session;

		try {
			// 1. Setup: Device A and Device B share a room
			await createRoomAndJoinPeer(session);

			// 2. Device B goes offline
			await contextB.setOffline(true);

			// 3. Device A adds a feeding entry
			await pageA.goto('/feeding');
			await pageA.getByRole('button', { name: 'Left Breast' }).click();
			await pageA.getByRole('button', { name: 'End Feeding' }).click();
			await expect(pageA.getByText('Left Breast')).toHaveCount(2);

			// 4. Wait for Device A to save a server snapshot (interval is 30s)
			// We wait 35s to be sure.
			await pageA.waitForTimeout(35_000);

			// 5. Device A goes offline (we just close the page/context)
			await pageA.close();

			// 6. Device B comes back online
			await contextB.setOffline(false);

			// 7. Verify: Device B should see the feeding entry from Device A
			// WITHOUT a page reload. We are already on Device B (it was at '/')
			// and we want to see if it catches up.
			await pageB.getByRole('link', { name: 'Feeding' }).click();

			// Device B should see the feeding entry from Device A.
			// If it only syncs P2P, this will fail because Device A is offline.
			// It should have loaded the server snapshot upon reconnection.
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 60_000,
			});
		} finally {
			await session.close();
		}
	});
});
