import type { Page } from '@playwright/test';
import {
	enableSkipProfile,
	expect,
	skipBackupReminder,
	test,
} from './fixtures/test';
import { addManualFeedingEntry } from './helpers/feeding';
import { createRoom, joinRoom } from './helpers/rooms';
import { PRODUCTION_BASE_URL } from './helpers/servers';

// The service worker is only registered in production builds.
test.use({ baseURL: PRODUCTION_BASE_URL });

function feedingEntry(page: Page, minutes: number) {
	return page
		.getByTestId('feeding-history-entry')
		.filter({ hasText: `${minutes} min` });
}

async function waitForServiceWorker(page: Page) {
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	// The worker claims open pages once activated.
	await expect
		.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
		.toBe(true);
}

test.describe('Offline first load', () => {
	test('starts and navigates without a network connection', async ({
		context,
		page,
	}) => {
		test.setTimeout(120_000);
		await page.goto('/');
		await waitForServiceWorker(page);
		await addManualFeedingEntry(page, { minutes: 12 });

		await context.setOffline(true);

		await page.reload();
		await expect(feedingEntry(page, 12)).toHaveCount(1);

		// Full page loads of other routes come from the precache.
		await page.goto('/diaper');
		await expect(page.getByTestId('quick-urine-button')).toBeVisible();
		await page.goto('/statistics');
		await expect(page.locator('main')).toBeVisible();

		// Client-side navigation keeps working offline.
		await page.goto('/');
		await page
			.getByRole('link', { name: /feeding/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/feeding$/);
		await expect(feedingEntry(page, 12)).toHaveCount(1);

		await addManualFeedingEntry(page, { minutes: 13 });
		await page.reload();
		await expect(feedingEntry(page, 13)).toHaveCount(1);
	});

	test('entries made during an offline start reach other devices once online', async ({
		browser,
		context,
		page,
	}) => {
		test.setTimeout(180_000);
		await page.goto('/');
		await waitForServiceWorker(page);
		const roomName = await createRoom(page);

		await context.setOffline(true);
		await page.goto('/feeding');
		await addManualFeedingEntry(page, { minutes: 27 });
		await page.reload();
		await expect(feedingEntry(page, 27)).toHaveCount(1);

		await context.setOffline(false);

		const peerContext = await browser.newContext({
			baseURL: PRODUCTION_BASE_URL,
		});
		// Production builds expose the store to the e2e helpers only in tests.
		await peerContext.addInitScript(() => {
			(window as unknown as { __E2E_TESTS__: boolean }).__E2E_TESTS__ = true;
		});
		await skipBackupReminder(peerContext);
		await enableSkipProfile(peerContext);
		try {
			const peer = await peerContext.newPage();
			await joinRoom(peer, roomName);
			await peer.goto('/feeding');
			await expect(feedingEntry(peer, 27)).toHaveCount(1, {
				timeout: 60_000,
			});
		} finally {
			await peerContext.close();
		}
	});
});
