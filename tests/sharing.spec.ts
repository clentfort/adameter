import { expect, test } from './fixtures/test';
import {
	createRoomAndJoinPeer,
	createRoomSyncSession,
} from './helpers/room-sync';

test.describe('Sharing via TinyBase', () => {
	test('should synchronize data between two browser contexts', async ({
		browser,
	}) => {
		const session = await createRoomSyncSession(browser);

		try {
			const { pageA, pageB } = session;

			await createRoomAndJoinPeer(session);
			await pageA.goto('/');
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
		} finally {
			await session.close();
		}
	});
});
