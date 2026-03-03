import { expect, test } from '@playwright/test';

test.describe('Room consistency', () => {
	test('should synchronize data between two browser contexts with different room name casing and spaces', async ({
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

		// Use a unique room name for each test run to avoid data accumulation
		const roomNameBase = `Consistency-Test-Room-${Date.now()}`;
		const roomNameA = `  ${roomNameBase}  `;
		const roomNameB = roomNameBase.toLowerCase();

		// 1. Join room on Page A with spaces and mixed case
		await pageA.goto('/settings');
		await pageA.getByTestId('settings-sharing').click();
		await pageA.getByRole('tab', { name: /join room/i }).click();
		await pageA.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomNameA);
		await pageA.getByRole('button', { name: /join/i }).first().click();
		await pageA.getByRole('button', { name: /merge & join/i }).click();
		// Wait for connection
		await expect(pageA.getByText(/currently connected to:/i)).toBeVisible();

		// 2. Join room on Page B with lowercase
		await pageB.goto('/settings');
		await pageB.getByTestId('settings-sharing').click();
		await pageB.getByRole('tab', { name: /join room/i }).click();
		await pageB.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomNameB);
		await pageB.getByRole('button', { name: /join/i }).first().click();
		await pageB.getByRole('button', { name: /merge & join/i }).click();
		// Wait for connection
		await expect(pageB.getByText(/currently connected to:/i)).toBeVisible();

		// 3. Add data on Page A
		await pageA.goto('/feeding');
		await pageA.getByRole('button', { name: 'Add Entry' }).click();
		await pageA.getByTestId('right-breast-radio').click({ force: true });
		await pageA.getByLabel('minutes').fill('10', { force: true });
		await pageA.getByRole('button', { name: 'Save' }).click({ force: true });

		// Verify on Page A - using scoped locator to avoid strict mode violation
		const historyEntryA = pageA.getByTestId('feeding-history-entry').first();
		await expect(
			historyEntryA.getByText('10 min', { exact: true }),
		).toBeVisible();

		// 4. Verify data appears on Page B
		await pageB.goto('/feeding');
		// If they are in the same room and use the same key, it should sync.
		const historyEntryB = pageB.getByTestId('feeding-history-entry').first();
		await expect(
			historyEntryB.getByText('10 min', { exact: true }),
		).toBeVisible({
			timeout: 10_000,
		});
	});
});
