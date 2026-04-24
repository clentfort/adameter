import { expect, test, setTinyBaseValue } from './fixtures/test';
import { STORE_VALUE_SHOW_FEEDING } from '../src/lib/tinybase-sync/constants';

test.describe('Initial page redirection', () => {
	test('should redirect to /diaper when feeding is disabled', async ({ context, page }) => {
		// Set showFeeding to false before navigation
		await setTinyBaseValue(context, STORE_VALUE_SHOW_FEEDING, false);

		// Go to home page
		await page.goto('/');

		// Wait for redirect
		await page.waitForURL('**/diaper');

		// Check if we are on the diaper page
		expect(page.url()).toContain('/diaper');
	});

	test('should redirect to /feeding when feeding is enabled', async ({ context, page }) => {
		// Set showFeeding to true before navigation
		await setTinyBaseValue(context, STORE_VALUE_SHOW_FEEDING, true);

		// Go to home page
		await page.goto('/');

		// Wait for redirect
		await page.waitForURL('**/feeding');

		// Check if we are on the feeding page
		expect(page.url()).toContain('/feeding');
	});
});
