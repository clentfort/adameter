import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { createRoomSyncSession } from './helpers/room-sync';
import { createRoom, joinRoom } from './helpers/rooms';

test('owner data survives peer join and delayed refresh', async ({
	browser,
}) => {
	const session = await createRoomSyncSession(browser);

	try {
		const { pageA, pageB } = session;

		await addManualFeedingEntry(pageA, { breast: 'left', minutes: 12 });
		await expect(pageA.getByText('12 min', { exact: true })).toBeVisible();

		const roomName = await createRoom(pageA);
		await joinRoom(pageB, roomName);

		await pageA.goto('/feeding');
		await expect(pageA.getByText('12 min', { exact: true })).toBeVisible();

		await pageB.bringToFront();
		await pageA.bringToFront();
		await pageA.reload();
		await pageA.evaluate(() => {
			document.dispatchEvent(new Event('visibilitychange'));
			window.dispatchEvent(new Event('focus'));
		});

		await expect(pageA.getByText('12 min', { exact: true })).toBeVisible();
	} finally {
		await session.close();
	}
});
