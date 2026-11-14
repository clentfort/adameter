import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { controlRelay } from './helpers/relay';
import {
	createRoomAndJoinPeer,
	createRoomSyncSession,
} from './helpers/room-sync';

function feedingEntry(page: Page, minutes: number) {
	return page
		.getByTestId('feeding-history-entry')
		.filter({ hasText: `${minutes} min` });
}

test.describe('Relay outage', () => {
	test('both devices keep working while the relay is unreachable and converge once it is back', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, contextB, pageA, pageB } = session;

		try {
			const relayA = await controlRelay(contextA);
			const relayB = await controlRelay(contextB);
			await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 11 });
			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 11)).toHaveCount(1, {
				timeout: 20_000,
			});

			relayA.block();
			relayB.block();

			// A full reload must not wait for the relay.
			await pageA.reload();
			await pageB.reload();
			await expect(feedingEntry(pageA, 11)).toHaveCount(1);
			await expect(feedingEntry(pageB, 11)).toHaveCount(1);

			await addManualFeedingEntry(pageA, { minutes: 22 });
			await addManualFeedingEntry(pageB, { minutes: 33 });

			// Entries survive a reload during the outage.
			await pageA.reload();
			await expect(feedingEntry(pageA, 22)).toHaveCount(1);

			await pageB.goto('/settings/sharing');
			await expect(pageB.getByTestId('room-sync-status')).toContainText(
				'Offline',
			);
			await pageB.goto('/feeding');

			relayA.unblock();
			relayB.unblock();

			// Both devices pick up the other's entries without a reload.
			await expect(feedingEntry(pageA, 33)).toHaveCount(1, {
				timeout: 90_000,
			});
			await expect(feedingEntry(pageB, 22)).toHaveCount(1, {
				timeout: 90_000,
			});
			await expect(feedingEntry(pageA, 11)).toHaveCount(1);
			await expect(feedingEntry(pageB, 11)).toHaveCount(1);
		} finally {
			await session.close();
		}
	});

	test('a rate-limited relay does not block the app and is not flooded with requests', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, pageA, pageB } = session;

		try {
			const relayA = await controlRelay(contextA);
			await createRoomAndJoinPeer(session);

			relayA.block('rate-limited');
			await pageA.reload();
			await addManualFeedingEntry(pageA, { minutes: 17 });

			// Retries back off: an open tab makes only a handful of requests while
			// the relay rejects them, instead of one per change or interval.
			const requestsBefore = relayA.snapshotRequests;
			await addManualFeedingEntry(pageA, { minutes: 18 });
			await addManualFeedingEntry(pageA, { minutes: 19 });
			await pageA.waitForTimeout(30_000);
			expect(relayA.snapshotRequests - requestsBefore).toBeLessThanOrEqual(5);

			relayA.unblock();

			await pageB.goto('/feeding');
			for (const minutes of [17, 18, 19]) {
				await expect(feedingEntry(pageB, minutes)).toHaveCount(1, {
					timeout: 90_000,
				});
			}
		} finally {
			await session.close();
		}
	});

	test('an idle tab does not upload snapshots', async ({ browser }) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, pageA } = session;

		try {
			const relayA = await controlRelay(contextA);
			await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 14 });
			await pageA.waitForTimeout(3000);

			const uploads: string[] = [];
			pageA.on('request', (request) => {
				if (request.url().endsWith('/store') && request.method() === 'PUT') {
					uploads.push(request.url());
				}
			});
			const requestsBefore = relayA.snapshotRequests;
			await pageA.waitForTimeout(40_000);

			expect(uploads).toEqual([]);
			expect(relayA.snapshotRequests).toBe(requestsBefore);
		} finally {
			await session.close();
		}
	});
});
