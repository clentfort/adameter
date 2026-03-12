import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { createRoomSyncSession } from './helpers/room-sync';
import { createRoom, joinRoom } from './helpers/rooms';

/**
 * Regression test for data loss during remote store load.
 *
 * Root cause: the old persister called store.setContent() when loading remote
 * data, which wholesale-replaced the store. Any local data (loaded from
 * IndexedDB before the network responded) was silently wiped.
 *
 * Fix: the persister now returns MergeableChanges (3-tuple) instead of
 * MergeableContent (2-tuple), causing TinyBase to call applyMergeableChanges()
 * instead of setMergeableContent(). This preserves local data that isn't
 * present in the remote snapshot.
 */
test('local data is preserved when joining a room with a slow remote load', async ({
	browser,
}) => {
	const session = await createRoomSyncSession(browser);

	try {
		const { pageA, pageB } = session;

		// Page A creates a room with a feeding entry (20 min, right breast)
		await addManualFeedingEntry(pageA, { breast: 'right', minutes: 20 });
		const roomName = await createRoom(pageA);

		// Page B adds a local feeding entry BEFORE joining the room (10 min, left breast)
		await addManualFeedingEntry(pageB, { breast: 'left', minutes: 10 });

		// Intercept the remote store fetch on page B to introduce a delay.
		// This simulates a slow network response during the join flow, keeping
		// the remote load in-flight while local data is already in the store.
		let resolveRemoteLoad!: () => void;
		const remoteLoadDelayed = new Promise<void>(
			(resolve) => (resolveRemoteLoad = resolve),
		);

		await pageB.route(
			'**/parties/tinybase/**/mergeable-store',
			async (route) => {
				// Only delay GET requests (the initial load, not the PUT save)
				if (route.request().method() === 'GET') {
					await remoteLoadDelayed;
				}
				await route.continue();
			},
		);

		// Page B starts joining the room. The splash screen will appear and
		// stay visible until the (delayed) remote load resolves.
		const joinPromise = joinRoom(pageB, roomName);

		// Give the join process time to reach the remote fetch
		await pageB.waitForTimeout(500);

		// Release the delayed remote load, allowing it to complete
		resolveRemoteLoad();

		// Wait for the join to finish (splash screen dismissed)
		await joinPromise;

		// Navigate to feeding to verify data
		await pageB.goto('/feeding');

		// Page B's local entry (added before joining) must survive the remote load
		await expect(
			pageB
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '10 min' })
				.first(),
		).toBeVisible({ timeout: 10_000 });

		// Page A's remote entry must also be present (sync worked)
		await expect(
			pageB
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '20 min' })
				.first(),
		).toBeVisible({ timeout: 10_000 });
	} finally {
		await session.close();
	}
});

test('data added on one device syncs to a second device via room', async ({
	browser,
}) => {
	const session = await createRoomSyncSession(browser);

	try {
		const { pageA, pageB } = session;

		// Page A creates a room and adds data
		const roomName = await createRoom(pageA);
		await addManualFeedingEntry(pageA, { breast: 'right', minutes: 30 });

		// Page B joins the same room
		await joinRoom(pageB, roomName);

		// Both devices should see the entry
		await pageB.goto('/feeding');
		await expect(
			pageB
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '30 min' })
				.first(),
		).toBeVisible({ timeout: 15_000 });
	} finally {
		await session.close();
	}
});

test('data added on both devices independently is preserved after joining', async ({
	browser,
}) => {
	const session = await createRoomSyncSession(browser);

	try {
		const { pageA, pageB } = session;

		// Both devices independently add data before connecting
		await addManualFeedingEntry(pageA, { breast: 'right', minutes: 25 });
		await addManualFeedingEntry(pageB, { breast: 'left', minutes: 15 });

		// Page A creates a room, page B joins with merge
		const roomName = await createRoom(pageA);
		await joinRoom(pageB, roomName);

		// Both entries must survive the merge
		await pageB.goto('/feeding');
		await expect(
			pageB
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '15 min' })
				.first(),
		).toBeVisible({ timeout: 10_000 });
		await expect(
			pageB
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '25 min' })
				.first(),
		).toBeVisible({ timeout: 10_000 });
	} finally {
		await session.close();
	}
});
