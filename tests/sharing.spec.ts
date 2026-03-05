import { enableSkipProfile, expect, test } from './fixtures/test';
import { createRoom, joinRoom } from './helpers/rooms';

test.describe('Sharing via TinyBase', () => {
	test('should synchronize data between two browser contexts', async ({
		browser,
	}) => {
		const contextA = await browser.newContext();
		const contextB = await browser.newContext();
		await enableSkipProfile(contextA);
		await enableSkipProfile(contextB);

		const pageA = await contextA.newPage();
		const pageB = await contextB.newPage();

		await pageA.goto('/');
		await pageB.goto('/');

		const roomName = await createRoom(pageA);
		await pageA.goto('/');

		await joinRoom(pageB, roomName);
		await pageB.goto('/');

		await pageA.getByRole('link', { name: 'Feeding' }).click();
		await pageA.getByRole('button', { name: 'Left Breast' }).click();
		await pageA.getByRole('button', { name: 'End Feeding' }).click();

		await expect(pageA.getByText('Left Breast')).toHaveCount(2);

		await pageB.goto('/');
		await pageB.getByRole('link', { name: 'Feeding' }).click();
		await expect(pageB.getByText('Left Breast')).toHaveCount(2, {
			timeout: 30_000,
		});
	});
});
