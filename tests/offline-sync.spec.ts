import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import {
	createRoomAndJoinPeer,
	createRoomSyncSession,
} from './helpers/room-sync';

async function addManualFeedingEntryOffline(
	page: Parameters<typeof addManualFeedingEntry>[0],
	breast: 'left' | 'right',
) {
	await page.getByRole('button', { name: 'Add Entry' }).click({ force: true });
	await page
		.getByTestId(breast === 'left' ? 'left-breast-radio' : 'right-breast-radio')
		.click({ force: true });
	await page.getByLabel('Duration (minutes)').fill('1', { force: true });
	await page.getByRole('button', { name: 'Save' }).click({ force: true });
	await expect(page.getByRole('dialog')).not.toBeVisible();
}

test.describe('Offline Synchronization', () => {
	test.describe.configure({ mode: 'serial' });

	test('data added by Device A while Device B is offline is visible to Device B after reconnect, even if Device A is now offline', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextB, pageA, pageB } = session;

		try {
			// 1. Both devices share a room
			await createRoomAndJoinPeer(session);

			// 2. Device B goes offline
			await contextB.setOffline(true);

			// 3. Device A records a feeding; wait for snapshot to be saved
			await pageA.goto('/feeding');
			const saveAPromise = pageA.waitForResponse(
				(res) =>
					res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30_000 },
			);
			await pageA.getByRole('button', { name: 'Left Breast' }).click();
			await pageA.getByRole('button', { name: 'End Feeding' }).click();
			await expect(pageA.getByText('Left Breast')).toHaveCount(2);
			await saveAPromise;

			// 4. Device A goes offline
			await pageA.context().setOffline(true);

			// 5. Device B comes back online and should see Device A's entry
			await contextB.setOffline(false);
			await pageB.goto('/feeding');
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 20_000,
			});
		} finally {
			try {
				await session.close();
			} catch {
				// Ignore
			}
		}
	});

	test('offline writes from both devices are merged when they reconnect sequentially', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, contextB, pageA, pageB } = session;

		try {
			// 1. Both devices join the same room
			await createRoomAndJoinPeer(session);

			// Navigate before going offline to avoid ERR_INTERNET_DISCONNECTED
			await pageA.goto('/feeding');
			await pageB.goto('/feeding');
			await expect(
				pageA.getByRole('button', { name: 'Left Breast' }),
			).toBeVisible();
			await expect(
				pageB.getByRole('button', { name: 'Right Breast' }),
			).toBeVisible();

			// 2. Both go offline simultaneously
			await contextA.setOffline(true);
			await contextB.setOffline(true);

			// 3. Device A records a feeding while offline
			await addManualFeedingEntryOffline(pageA, 'left');
			await expect(
				pageA
					.getByTestId('feeding-history-entry')
					.filter({ hasText: 'Left Breast' }),
			).toHaveCount(1);

			// 4. Device B records a feeding while offline
			await addManualFeedingEntryOffline(pageB, 'right');
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: 'Right Breast' }),
			).toHaveCount(1);

			// 5. Device A comes back online and saves its snapshot
			const saveAPromise = pageA.waitForResponse(
				(res) =>
					res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30_000 },
			);
			await contextA.setOffline(false);
			await saveAPromise;

			// 6. Device A goes offline again
			await contextA.setOffline(true);

			// 7. Device B comes back online; it should load A's snapshot and merge
			//    its own offline writes, then save the combined state
			const saveBPromise = pageB.waitForResponse(
				(res) =>
					res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30_000 },
			);
			await contextB.setOffline(false);

			// Device B must see both feedings (CRDT merge of offline writes)
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: 'Left Breast' }),
			).toHaveCount(1, {
				timeout: 20_000,
			});
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: 'Right Breast' }),
			).toHaveCount(1, {
				timeout: 20_000,
			});

			// Wait for B to persist the merged snapshot
			await saveBPromise;

			// 8. Device A reconnects and should see Device B's offline entry via
			//    the merged snapshot that Device B saved
			await contextA.setOffline(false);
			await expect(
				pageA
					.getByTestId('feeding-history-entry')
					.filter({ hasText: 'Right Breast' }),
			).toHaveCount(1, {
				timeout: 20_000,
			});
		} finally {
			try {
				await session.close();
			} catch {
				// Ignore
			}
		}
	});

	test('an edit made by Device A while Device B is offline is visible to Device B after reconnect', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { contextB, pageA, pageB } = session;

		try {
			// 1. Both devices share a room and see the same initial entry
			await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 10 });
			await pageB.goto('/feeding');
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '10 min' })
					.first(),
			).toBeVisible({ timeout: 20_000 });

			// 2. Device B goes offline
			await contextB.setOffline(true);

			// 3. Device A edits the entry; wait for the post-edit snapshot save.
			const saveAPromise = pageA.waitForResponse(
				(res) =>
					res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30_000 },
			);
			await pageA.getByTestId('history-entry-actions').first().click();
			await pageA.getByRole('menuitem', { name: 'Edit' }).click();
			await pageA.getByLabel('minutes').fill('20', { force: true });
			await pageA.getByRole('button', { name: 'Save' }).click({ force: true });
			await expect(
				pageA
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '20 min' }),
			).toHaveCount(1);
			await saveAPromise;

			// 4. Device A goes offline
			await pageA.context().setOffline(true);

			// 5. Device B comes back online; PartySocket reconnects, fires `open`,
			//    and the handleOpen listener re-bootstraps from the server snapshot.
			await contextB.setOffline(false);
			await expect(async () => {
				const updatedEntries = pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '20 min' });
				const originalEntries = pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '10 min' });

				const hasUpdatedEntry = (await updatedEntries.count()) > 0;
				const hasStaleEntry = (await originalEntries.count()) > 0;

				if (!hasUpdatedEntry || hasStaleEntry) {
					await pageB.reload();
				}

				expect(await updatedEntries.count()).toBeGreaterThan(0);
				expect(await originalEntries.count()).toBe(0);
			}).toPass({ timeout: 90_000 });
		} finally {
			try {
				await session.close();
			} catch {
				// Ignore
			}
		}
	});

	test('a delete made by Device A while Device B is offline is reflected on Device B after reconnect', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextB, pageA, pageB } = session;

		try {
			// 1. Both devices share a room and see the same initial entry
			await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 10 });
			await pageB.goto('/feeding');
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '10 min' })
					.first(),
			).toBeVisible({ timeout: 20_000 });

			// 2. Device B goes offline
			await contextB.setOffline(true);

			// 3. Device A deletes the entry; wait for snapshot to be saved
			const saveAPromise = pageA.waitForResponse(
				(res) =>
					res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30_000 },
			);
			await pageA.getByTestId('history-entry-actions').first().click();
			await pageA.getByRole('menuitem', { name: 'Delete' }).click();
			await pageA
				.getByRole('alertdialog')
				.getByRole('button', { name: 'Delete' })
				.click({ force: true });
			await expect(
				pageA.getByText('10 min', { exact: true }),
			).not.toBeVisible();
			await saveAPromise;

			// 4. Device A goes offline
			await pageA.context().setOffline(true);

			// 5. Device B comes back online; the handleOpen reconnect listener
			//    re-bootstraps from the server snapshot (which has the deletion).
			//    The store updates reactively — no page reload needed.
			await contextB.setOffline(false);
			await expect(pageB.getByText('10 min', { exact: true })).not.toBeVisible({
				timeout: 20_000,
			});
		} finally {
			try {
				await session.close();
			} catch {
				// Ignore
			}
		}
	});

	test('edits and deletes made by Device A while Device B is offline are reflected on Device B after a full page reload', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextB, pageA, pageB } = session;

		try {
			// 1. Both devices share a room and see the same initial entries
			await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 10 });
			await addManualFeedingEntry(pageA, { minutes: 20 });
			await pageB.goto('/feeding');
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '10 min' }),
			).toBeVisible({ timeout: 20_000 });
			await expect(
				pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '20 min' }),
			).toBeVisible();

			// 2. Device B goes offline
			await contextB.setOffline(true);

			// 3. Device A edits the 20-min entry to 30 min and deletes the 10-min
			//    entry. Target entries by text to avoid relying on list order.
			const twentyMinuteEntryA = pageA
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '20 min' })
				.first();
			await expect(twentyMinuteEntryA).toBeVisible();
			await twentyMinuteEntryA.getByTestId('history-entry-actions').click();
			await pageA.getByRole('menuitem', { name: 'Edit' }).click();
			await pageA.getByLabel('minutes').fill('30', { force: true });
			await pageA.getByRole('button', { name: 'Save' }).click({ force: true });
			await expect(
				pageA
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '30 min' }),
			).toHaveCount(1);

			const saveAPromise = pageA.waitForResponse(
				(res) =>
					res.url().includes('/store') && res.request().method() === 'PUT',
				{ timeout: 30_000 },
			);
			const tenMinuteEntryA = pageA
				.getByTestId('feeding-history-entry')
				.filter({ hasText: '10 min' })
				.first();
			await expect(tenMinuteEntryA).toBeVisible();
			await tenMinuteEntryA.getByTestId('history-entry-actions').click();
			await pageA.getByRole('menuitem', { name: 'Delete' }).click();
			await pageA
				.getByRole('alertdialog')
				.getByRole('button', { name: 'Delete' })
				.click({ force: true });
			await expect(
				pageA
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '10 min' }),
			).toHaveCount(0);
			await saveAPromise;

			// 4. Device A goes offline
			await pageA.context().setOffline(true);

			// 5. Device B comes back online and does a full page navigation —
			//    this exercises the initial bootstrap() path (not handleOpen).
			await contextB.setOffline(false);
			await pageB.goto('/feeding');
			await expect(async () => {
				const thirtyMinuteEntriesB = pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '30 min' });
				const tenMinuteEntriesB = pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '10 min' });
				const twentyMinuteEntriesB = pageB
					.getByTestId('feeding-history-entry')
					.filter({ hasText: '20 min' });

				const hasThirtyMinuteEntry = (await thirtyMinuteEntriesB.count()) > 0;
				const hasStaleEntries =
					(await tenMinuteEntriesB.count()) > 0 ||
					(await twentyMinuteEntriesB.count()) > 0;

				if (!hasThirtyMinuteEntry || hasStaleEntries) {
					await pageB.reload();
				}

				expect(await thirtyMinuteEntriesB.count()).toBeGreaterThan(0);
				expect(await tenMinuteEntriesB.count()).toBe(0);
				expect(await twentyMinuteEntriesB.count()).toBe(0);
			}).toPass({ timeout: 60_000 });
		} finally {
			try {
				await session.close();
			} catch {
				// Ignore
			}
		}
	});
});
