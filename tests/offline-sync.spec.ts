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
		const { contextB, pageA, pageB } = session;

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

			// 4. Wait for Device A to successfully save the snapshot
			const savePromise = pageA.waitForResponse(
				(res) => res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30000 },
			);
			await savePromise;
			await pageA.waitForTimeout(1000);

			// 5. Device A goes offline
			await pageA.context().setOffline(true);

			// 6. Device B comes back online
			await contextB.setOffline(false);

			// 7. Verify: Device B should see the feeding entry from Device A
			await pageB.goto('/feeding');

			// Device B should see the feeding entry from Device A.
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 20_000,
			});
		} finally {
			try {
				await session.close();
			} catch (e) {}
		}
	});

	test('merging writes while both devices are offline', async ({ browser }) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, contextB, pageA, pageB } = session;

		try {
			// 1. Setup: Both join
			await createRoomAndJoinPeer(session);

			// Navigate to target page before going offline to avoid ERR_INTERNET_DISCONNECTED
			await pageA.goto('/feeding');
			await pageB.goto('/feeding');

			// 2. Both go offline
			await contextA.setOffline(true);
			await contextB.setOffline(true);

			// 3. Device A records a feeding
			await pageA.getByRole('button', { name: 'Left Breast' }).click();
			await pageA.getByRole('button', { name: 'End Feeding' }).click();
			await expect(pageA.getByText('Left Breast')).toHaveCount(2);

			// 4. Device B records a feeding
			await pageB.getByRole('button', { name: 'Right Breast' }).click();
			await pageB.getByRole('button', { name: 'End Feeding' }).click();
			await expect(pageB.getByText('Right Breast')).toHaveCount(2);

			// 5. Device A comes back online, waits for save, then goes offline
			await contextA.setOffline(false);
			const saveAPromise = pageA.waitForResponse(
				(res) => res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30000 },
			);
			await saveAPromise;
			await pageA.waitForTimeout(1000);
			await contextA.setOffline(true);

			// 6. Device B comes back online
			// Device B also needs to save its own changes merged with Device A's changes
			await contextB.setOffline(false);
			const saveBPromise = pageB.waitForResponse(
				(res) => res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30000 },
			);

			// 7. Device B should see BOTH feedings (merged)
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 20_000,
			});
			await expect(pageB.getByText('Right Breast')).toHaveCount(2, {
				timeout: 20_000,
			});

			// Wait for B to save the merged result
			await saveBPromise;
		} finally {
			try {
				await session.close();
			} catch (e) {}
		}
	});
});
