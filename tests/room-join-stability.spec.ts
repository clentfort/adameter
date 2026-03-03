import { expect, test } from '@playwright/test';

test('owner data survives peer join and delayed refresh', async ({
	browser,
}) => {
	const contextA = await browser.newContext();
	const contextB = await browser.newContext();

	await contextA.addInitScript(() => {
		window.localStorage.setItem('adameter-skip-profile', 'true');
	});
	await contextB.addInitScript(() => {
		window.localStorage.setItem('adameter-skip-profile', 'true');
	});

	const pageA = await contextA.newPage();
	const pageB = await contextB.newPage();

	await pageA.goto('/feeding');
	await pageA.getByRole('button', { name: 'Add Entry' }).click();
	await pageA.getByTestId('left-breast-radio').click({ force: true });
	await pageA.getByLabel('minutes').fill('12', { force: true });
	await pageA.getByRole('button', { name: 'Save' }).click({ force: true });
	await expect(pageA.getByText('12 min', { exact: true })).toBeVisible();

	await pageA.goto('/settings');
	await pageA.getByTestId('settings-sharing').click();
	await pageA.getByRole('tab', { name: /create room/i }).click();
	await pageA.getByRole('button', { name: /create new room/i }).click();
	const roomName = (await pageA.locator('.room-name').textContent())?.trim();
	expect(roomName).toBeTruthy();

	await pageB.goto('/settings');
	await pageB.getByTestId('settings-sharing').click();
	await pageB.getByRole('tab', { name: /join room/i }).click();
	await pageB.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomName!);
	await pageB.getByRole('button', { name: /join/i }).first().click();
	await pageB.getByRole('button', { name: /merge & join/i }).click();
	await expect(pageB.locator('.room-name')).toHaveText(roomName!);

	await pageA.goto('/feeding');
	await expect(pageA.getByText('12 min', { exact: true })).toBeVisible();

	await pageB.bringToFront();
	await pageA.bringToFront();
	await pageA.waitForTimeout(10_000);
	await pageA.evaluate(() => {
		document.dispatchEvent(new Event('visibilitychange'));
		window.dispatchEvent(new Event('focus'));
	});

	await expect(pageA.getByText('12 min', { exact: true })).toBeVisible();

	await contextA.close();
	await contextB.close();
});
