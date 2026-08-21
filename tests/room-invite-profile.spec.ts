import { enableSkipProfile, expect, test } from './fixtures/test';
import { createRoom } from './helpers/rooms';

test('fresh device joins an existing room before profile setup is shown', async ({
	browser,
}) => {
	const ownerContext = await browser.newContext();
	const freshContext = await browser.newContext();

	try {
		await enableSkipProfile(ownerContext);
		const ownerPage = await ownerContext.newPage();
		await ownerPage.goto('/');
		const roomName = await createRoom(ownerPage);

		const freshPage = await freshContext.newPage();
		await freshPage.goto(
			`/settings/sharing?room=${encodeURIComponent(roomName)}`,
		);

		await expect(
			freshPage.getByRole('heading', { name: /join room/i }),
		).toBeVisible();
		await expect(
			freshPage.getByRole('heading', { name: /welcome to adameter/i }),
		).toHaveCount(0);

		await freshPage
			.getByRole('button', { name: /merge & join|zusammenführen/i })
			.click();
		await expect(freshPage.getByTestId('settings-room-name')).toHaveText(
			roomName,
		);
		await expect(
			freshPage.getByRole('heading', { name: /welcome to adameter/i }),
		).toHaveCount(0);

		await freshPage.goto('/settings/children');
		await expect(freshPage.getByText('E2E Baby')).toBeVisible();
	} finally {
		await ownerContext.close();
		await freshContext.close();
	}
});
