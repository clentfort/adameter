import type { Page } from '@playwright/test';
import { createMergeableStore } from 'tinybase';
import {
	encrypt,
	getEncryptionKey,
	hashRoomId,
	jsonStringWithUndefined,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { controlRelay, waitForAnyCellUpload } from './helpers/relay';
import {
	createRoomAndJoinPeer,
	createRoomSyncSession,
} from './helpers/room-sync';
import { joinRoom, openSharingSettings } from './helpers/rooms';
import { RELAY_ORIGIN } from './helpers/servers';

type Row = Record<string, boolean | number | string>;

interface StoreWindow {
	tinybaseStore: {
		getCell: (table: string, row: string, cell: string) => unknown;
		getRowCount: (table: string) => number;
		setCell: (table: string, row: string, cell: string, value: unknown) => void;
		setRow: (table: string, row: string, value: Row) => void;
		transaction: (actions: () => void) => void;
	};
}

function feedingEntry(page: Page, minutes: number) {
	return page
		.getByTestId('feeding-history-entry')
		.filter({ hasText: `${minutes} min` });
}

function getCell(page: Page, table: string, row: string, cell: string) {
	return page.evaluate(
		([table_, row_, cell_]) =>
			(window as unknown as StoreWindow).tinybaseStore.getCell(
				table_,
				row_,
				cell_,
			),
		[table, row, cell] as const,
	);
}

function setCells(
	page: Page,
	table: string,
	row: string,
	cells: Record<string, string>,
) {
	return page.evaluate(
		({ cells: cells_, row: row_, table: table_ }) => {
			const { tinybaseStore } = window as unknown as StoreWindow;
			tinybaseStore.transaction(() => {
				for (const [cell, value] of Object.entries(cells_)) {
					tinybaseStore.setCell(table_, row_, cell, value);
				}
			});
		},
		{ cells, row, table },
	);
}

function getEventCount(page: Page) {
	return page.evaluate(() =>
		(window as unknown as StoreWindow).tinybaseStore.getRowCount('events'),
	);
}

test.describe('Per-cell sync', () => {
	test('a new entry reaches an online device with one upload and no pull', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, contextB, pageA, pageB } = session;

		try {
			const relayA = await controlRelay(contextA);
			const relayB = await controlRelay(contextB);
			await createRoomAndJoinPeer(session);
			await pageA.goto('/feeding');
			await pageB.goto('/feeding');
			// Let the uploads and pulls of joining settle.
			await pageA.waitForTimeout(8000);
			const countsA = { ...relayA.counts };
			const countsB = { ...relayB.counts };

			await pageA.getByRole('button', { name: 'Left Breast' }).click();
			await pageA.getByRole('button', { name: 'End Feeding' }).click();
			await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
				timeout: 20_000,
			});
			await pageA.waitForTimeout(3000);

			const perChange = {
				deviceA: {
					pulls: relayA.counts.cellPulls - countsA.cellPulls,
					uploads: relayA.counts.cellUploads - countsA.cellUploads,
				},
				deviceB: {
					messages: relayB.counts.socketMessages - countsB.socketMessages,
					pulls: relayB.counts.cellPulls - countsB.cellPulls,
					uploads: relayB.counts.cellUploads - countsB.cellUploads,
				},
			};
			test.info().annotations.push({
				description: JSON.stringify(perChange),
				type: 'traffic per change',
			});
			expect(perChange).toEqual({
				deviceA: { pulls: 0, uploads: 1 },
				deviceB: { messages: 1, pulls: 0, uploads: 0 },
			});
		} finally {
			await session.close();
		}
	});

	test('a device that was offline pulls only what changed', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextB, pageA, pageB } = session;

		try {
			await createRoomAndJoinPeer(session);
			for (const minutes of [1, 2, 3, 4, 5]) {
				await addManualFeedingEntry(pageA, { minutes });
			}
			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 5)).toHaveCount(1, { timeout: 20_000 });
			await pageB.waitForTimeout(2000);
			const relayB = await controlRelay(contextB);

			await contextB.setOffline(true);
			const upload = waitForAnyCellUpload(pageA);
			await addManualFeedingEntry(pageA, { minutes: 6 });
			await upload;
			await contextB.setOffline(false);

			await expect(feedingEntry(pageB, 6)).toHaveCount(1, { timeout: 30_000 });
			// The new entry has fewer than ten cells; the older entries are not
			// downloaded again.
			expect(relayB.counts.pulledCells).toBeLessThan(10);
		} finally {
			await session.close();
		}
	});

	test('concurrent edits of different cells survive and the later edit of the same cell wins', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, contextB, pageA, pageB } = session;

		try {
			await createRoomAndJoinPeer(session);
			await setCells(pageA, 'events', 'shared-event', {
				notes: 'initial',
				startDate: '2026-11-01T10:00:00.000Z',
				title: 'Checkup',
				type: 'point',
			});
			await expect
				.poll(() => getCell(pageB, 'events', 'shared-event', 'title'), {
					timeout: 20_000,
				})
				.toBe('Checkup');

			await contextA.setOffline(true);
			await contextB.setOffline(true);
			await setCells(pageA, 'events', 'shared-event', {
				notes: 'from A',
				title: 'Checkup (A)',
			});
			await pageA.waitForTimeout(50);
			await setCells(pageB, 'events', 'shared-event', {
				color: '#ff0000',
				notes: 'from B',
			});
			await contextA.setOffline(false);
			await contextB.setOffline(false);

			for (const page of [pageA, pageB]) {
				await expect
					.poll(() => getCell(page, 'events', 'shared-event', 'title'), {
						timeout: 30_000,
					})
					.toBe('Checkup (A)');
				await expect
					.poll(() => getCell(page, 'events', 'shared-event', 'color'), {
						timeout: 30_000,
					})
					.toBe('#ff0000');
				await expect
					.poll(() => getCell(page, 'events', 'shared-event', 'notes'), {
						timeout: 30_000,
					})
					.toBe('from B');
			}
		} finally {
			await session.close();
		}
	});

	test('a large backlog syncs completely after an interrupted upload', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { contextA, pageA, pageB } = session;

		try {
			await createRoomAndJoinPeer(session);
			await pageA.waitForTimeout(3000);

			// Drop the second upload batch once, like a lost connection.
			let uploads = 0;
			await contextA.route(`${RELAY_ORIGIN}/**/cells`, async (route) => {
				if (route.request().method() === 'POST' && ++uploads === 2) {
					await route.abort('connectionreset');
					return;
				}
				await route.fallback();
			});

			await pageA.evaluate(() => {
				const { tinybaseStore } = window as unknown as StoreWindow;
				tinybaseStore.transaction(() => {
					for (let index = 0; index < 400; index += 1) {
						tinybaseStore.setRow('events', `backlog-${index}`, {
							deviceId: 'device-a',
							startDate: '2026-11-01T10:00:00.000Z',
							title: `Backlog ${index}`,
							type: 'point',
						});
					}
				});
			});

			await expect
				.poll(() => getEventCount(pageB), { timeout: 90_000 })
				.toBe(400);
			expect(uploads).toBeGreaterThanOrEqual(4);
		} finally {
			await session.close();
		}
	});

	test('a room with only a legacy snapshot is converted for new devices', async ({
		browser,
	}) => {
		test.setTimeout(120_000);
		const roomName = `legacy-room-${Date.now()}`;
		const legacyStore = createMergeableStore();
		legacyStore.setRow('events', 'legacy-event', {
			deviceId: 'old-device',
			startDate: '2026-10-01T10:00:00.000Z',
			title: 'From the old app',
			type: 'point',
		});
		const response = await fetch(
			`${RELAY_ORIGIN}/parties/tinybase/${await hashRoomId(roomName)}/store`,
			{
				body: await encrypt(
					jsonStringWithUndefined(legacyStore.getMergeableContent()),
					await getEncryptionKey(roomName),
				),
				headers: { 'If-Match': '"0"' },
				method: 'PUT',
			},
		);
		expect(response.status).toBe(200);

		const session = await createRoomSyncSession(browser);
		const { contextB, pageA, pageB } = session;

		try {
			await joinRoom(pageA, roomName);
			await expect
				.poll(() => getCell(pageA, 'events', 'legacy-event', 'title'), {
					timeout: 20_000,
				})
				.toBe('From the old app');

			// The second device only gets the data through the converted cells.
			await contextB.route(`${RELAY_ORIGIN}/**/store`, (route) =>
				route.abort('connectionrefused'),
			);
			await joinRoom(pageB, roomName);
			await expect
				.poll(() => getCell(pageB, 'events', 'legacy-event', 'title'), {
					timeout: 30_000,
				})
				.toBe('From the old app');
		} finally {
			await session.close();
		}
	});

	test('a factory reset and rejoin keep the room data on all devices', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { pageA, pageB } = session;

		try {
			const roomName = await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 21 });
			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 21)).toHaveCount(1, {
				timeout: 20_000,
			});

			await pageB.goto('/settings/data');
			await pageB.getByRole('button', { name: 'Factory Reset' }).click();
			await pageB.getByPlaceholder('Type "delete" here').fill('delete');
			const download = pageB.waitForEvent('download');
			// The app reloads after the reset.
			const reloaded = pageB.waitForEvent('load');
			await pageB.getByRole('button', { name: 'Delete everything' }).click();
			await download;
			await reloaded;
			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 21)).toHaveCount(0);

			await joinRoom(pageB, roomName);
			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 21)).toHaveCount(1, {
				timeout: 20_000,
			});
			await pageA.waitForTimeout(5000);
			await pageA.reload();
			await expect(feedingEntry(pageA, 21)).toHaveCount(1);
		} finally {
			await session.close();
		}
	});

	test('joining with "Clear & Join" replaces local data without deleting room data', async ({
		browser,
	}) => {
		test.setTimeout(180_000);
		const session = await createRoomSyncSession(browser);
		const { pageA, pageB } = session;

		try {
			const roomName = await createRoomAndJoinPeer(session);
			await addManualFeedingEntry(pageA, { minutes: 31 });
			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 31)).toHaveCount(1, {
				timeout: 20_000,
			});

			// Rejoin the same room on B and discard its local data.
			await openSharingSettings(pageB);
			await pageB.getByRole('button', { name: /leave room/i }).click();
			await addManualFeedingEntry(pageB, { minutes: 32 });
			await openSharingSettings(pageB);
			await pageB.getByRole('tab', { name: /join room/i }).click();
			await pageB.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomName);
			await pageB.getByRole('button', { name: /join/i }).first().click();
			// The app reloads to start from a fresh local store.
			const reloaded = pageB.waitForEvent('load');
			await pageB.getByRole('button', { name: 'Clear & Join' }).click();
			await reloaded;
			await expect(pageB.getByTestId('settings-room-name')).toHaveText(
				roomName,
				{ timeout: 20_000 },
			);

			await pageB.goto('/feeding');
			await expect(feedingEntry(pageB, 31)).toHaveCount(1, {
				timeout: 20_000,
			});
			await expect(feedingEntry(pageB, 32)).toHaveCount(0);
			await pageA.waitForTimeout(5000);
			await pageA.reload();
			await expect(feedingEntry(pageA, 31)).toHaveCount(1);
		} finally {
			await session.close();
		}
	});
});
