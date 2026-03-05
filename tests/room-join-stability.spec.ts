import { enableSkipProfile, expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { createRoom, joinRoom } from './helpers/rooms';

test('owner data survives peer join and delayed refresh', async ({
	browser,
}) => {
	const contextA = await browser.newContext();
	const contextB = await browser.newContext();
	await enableSkipProfile(contextA);
	await enableSkipProfile(contextB);

	const pageA = await contextA.newPage();
	const pageB = await contextB.newPage();

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

	await contextA.close();
	await contextB.close();
});
