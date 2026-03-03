import { expect, test } from '@playwright/test';

test.describe('Room deletion sync', () => {
	test('should synchronize deletions between two browser contexts', async ({
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

		const roomName = `Deletion-Test-Room-${Date.now()}`;

		// 1. Join same room on both pages
		for (const page of [pageA, pageB]) {
			await page.goto('/settings');
			await page.getByTestId('settings-sharing').click();
			await page.getByRole('tab', { name: /join room/i }).click();
			await page.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomName);
			await page.getByRole('button', { name: /join/i }).first().click();
			await page.getByRole('button', { name: /merge & join/i }).click();
			await expect(page.getByText(/currently connected to:/i)).toBeVisible();
		}

		// 2. Add data on Page A
		await pageA.goto('/feeding');
		await pageA.getByRole('button', { name: 'Add Entry' }).click();
		await pageA.getByTestId('right-breast-radio').click({ force: true });
		await pageA.getByLabel('minutes').fill('15', { force: true });
		await pageA.getByRole('button', { name: 'Save' }).click({ force: true });

		// Verify on Page A
		await expect(pageA.getByTestId('feeding-history-entry').getByText('15 min')).toBeVisible();

		// 3. Verify data appears on Page B
		await pageB.goto('/feeding');
		await expect(pageB.getByTestId('feeding-history-entry').getByText('15 min')).toBeVisible({
			timeout: 10_000,
		});

		// 4. Delete data on Page A
		await pageA.getByTestId('feeding-history-entry').first().getByRole('button', { name: /delete/i }).click();
		// Confirm deletion dialog
		await pageA.getByRole('button', { exact: true, name: /delete/i }).click();

		// Verify gone on Page A
		await expect(pageA.getByTestId('feeding-history-entry')).toHaveCount(0);

		// 5. Verify deletion syncs to Page B
		await expect(pageB.getByTestId('feeding-history-entry')).toHaveCount(0, {
			timeout: 10_000,
		});
	});
});
