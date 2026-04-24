import { STORE_VALUE_SHOW_FEEDING } from '../src/lib/tinybase-sync/constants';
import {
	enableSkipProfile,
	expect,
	setTinyBaseValue,
	test,
} from './fixtures/test';

test.describe('Initial page redirection', () => {
	test.beforeEach(async ({ context }) => {
		await enableSkipProfile(context);
	});

	test('should redirect to /diaper when feeding is disabled', async ({
		context,
		page,
	}) => {
		// Set showFeeding to false before navigation
		await setTinyBaseValue(context, STORE_VALUE_SHOW_FEEDING, false);

		// Go to home page
		await page.goto('/');

		// Wait for redirect
		await expect(page).toHaveURL(/\/diaper/, { timeout: 20_000 });
	});

	test('should redirect to /feeding when feeding is enabled', async ({
		context,
		page,
	}) => {
		// Set showFeeding to true before navigation
		await setTinyBaseValue(context, STORE_VALUE_SHOW_FEEDING, true);

		// Go to home page
		await page.goto('/');

		// Wait for redirect
		await expect(page).toHaveURL(/\/feeding/, { timeout: 20_000 });
	});
});
