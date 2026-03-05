import { enableSkipProfile, expect, test } from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { joinRoom } from './helpers/rooms';

test.describe('Room deletion sync', () => {
	test('should persist deletions across browser contexts', async ({
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

		const roomName = `Deletion-Test-Room-${Date.now()}`;

		for (const page of [pageA, pageB]) {
			await joinRoom(page, roomName);
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
			.getByRole('button', { name: /delete/i })
			.click();
		await pageA.getByRole('button', { exact: true, name: /delete/i }).click();

		await expect(pageA.getByTestId('feeding-history-entry')).toHaveCount(0);

		await expect(pageB.getByTestId('feeding-history-entry')).toHaveCount(0, {
			timeout: 10_000,
		});

		await pageB.goto('/');
		await pageB.getByRole('link', { name: 'Feeding' }).click();
		await expect(pageB.getByTestId('feeding-history-entry')).toHaveCount(0);
	});
});
