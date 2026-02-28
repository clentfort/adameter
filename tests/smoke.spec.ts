import { expect, test } from '@playwright/test';

const pages = [
	{ name: 'Dashboard', path: '/' },
	{ name: 'Feeding', path: '/feeding' },
	{ name: 'Diaper', path: '/diaper' },
	{ name: 'Events', path: '/events' },
	{ name: 'Growth', path: '/growth' },
	{ name: 'Statistics', path: '/statistics' },
	{ name: 'Settings', path: '/settings' },
	{ name: 'Data', path: '/data' },
	{ name: 'Privacy Policy', path: '/legal/privacy-policy' },
	{ name: 'Imprint', path: '/legal/imprint' },
];

test.describe('Smoke tests - Page Loads', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(() => {
			window.localStorage.setItem('adameter-skip-profile', 'true');
		});
	});

	for (const pageInfo of pages) {
		test(`should load ${pageInfo.name} page without errors`, async ({ page }) => {
			const errors: string[] = [];
			page.on('pageerror', (err) => errors.push(err.message));

			await page.goto(pageInfo.path);

			// Basic check that something rendered
			await expect(page.locator('body')).not.toBeEmpty();

			// Check for JS errors
			expect(errors).toEqual([]);
		});
	}
});
