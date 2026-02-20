import { expect, test } from '@playwright/test';

test.describe('Sharing via TinyBase', () => {
	test('should synchronize data between two browser contexts', async ({
		browser,
	}) => {
		const contextA = await browser.newContext();
		const contextB = await browser.newContext();

		const pageA = await contextA.newPage();
		const pageB = await contextB.newPage();

		// Skip profile on both
		for (const page of [pageA, pageB]) {
			await page.addInitScript(() => {
				window.localStorage.setItem('adameter-skip-profile', 'true');
			});
			await page.goto('/');
		}

		// 1. Create room on Page A
		await pageA.getByRole('button', { name: /sharing/i }).click();
		await pageA.getByRole('tab', { name: /create room/i }).click();
		await pageA.getByRole('button', { name: /create new room/i }).click();
		// Wait for dialog to close
		await expect(pageA.getByRole('dialog')).not.toBeVisible();

		// Get room name
		await pageA.getByRole('button', { name: /sharing/i }).click();
		const roomName = await pageA.locator('p.text-xl.font-bold').textContent();
		expect(roomName).toBeTruthy();
		// Close dialog
		await pageA.keyboard.press('Escape');

		// 2. Join room on Page B
		await pageB.getByRole('button', { name: /sharing/i }).click();
		await pageB.getByRole('tab', { name: /join room/i }).click();
		await pageB.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomName!);
		await pageB.getByRole('button', { name: /join/i }).first().click();
		await pageB.getByRole('button', { name: /merge & join/i }).click();
		await expect(pageB.getByRole('dialog')).not.toBeVisible();

		// 3. Add data on Page A
		await pageA.getByRole('link', { name: 'Feeding' }).click();
		await pageA.getByRole('button', { name: 'Left Breast' }).click();
		await pageA.getByRole('button', { name: 'End Feeding' }).click();

		// Verify on Page A
		await expect(
			pageA.getByTestId('feeding-history-entry').getByText('Left Breast'),
		).toBeVisible();

		// 4. Verify data appears on Page B
		await pageB.getByRole('link', { name: 'Feeding' }).click();
		// It might take a moment to sync via PartyKit
		await expect(
			pageB.getByTestId('feeding-history-entry').getByText('Left Breast'),
		).toBeVisible({ timeout: 15000 });
	});
});
