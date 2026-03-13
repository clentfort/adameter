import { expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import {
	createRoomSyncSession,
	joinRoomOnBothPages,
} from './helpers/room-sync';

test.describe('Room deletion sync', () => {
	test('should persist deletions across browser contexts', async ({
		browser,
	}) => {
		const session = await createRoomSyncSession(browser);

		try {
			const { pageA, pageB } = session;
			const roomName = `Deletion-Test-Room-${Date.now()}`;

			await joinRoomOnBothPages(session, roomName);

			for (const page of [pageA, pageB]) {
				await expect(page.getByText(/currently connected to:/i)).toBeVisible();
			}

			await addManualFeedingEntry(pageA, { breast: 'right', minutes: 15 });

			await expect(
				pageA.getByTestId('feeding-history-entry').getByText('15 min'),
			).toBeVisible();

			await pageB.goto('/feeding');
			await expect(
				pageB.getByTestId('feeding-history-entry').getByText('15 min'),
			).toBeVisible({
				timeout: 10_000,
			});

			await pageA
				.getByTestId('feeding-history-entry')
				.first()
				.getByTestId('history-entry-actions')
				.click();
			await pageA.getByRole('menuitem', { name: /delete/i }).click();
			await pageA.getByRole('button', { exact: true, name: /delete/i }).click();

			await expect(pageA.getByTestId('feeding-history-entry')).toHaveCount(0);

			await expect(pageB.getByTestId('feeding-history-entry')).toHaveCount(0, {
				timeout: 10_000,
			});

			await pageB.goto('/');
			await pageB.getByRole('link', { name: 'Feeding' }).click();
			await expect(pageB.getByTestId('feeding-history-entry')).toHaveCount(0);
		} finally {
			await session.close();
		}
	});
});
