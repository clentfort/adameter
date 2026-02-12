import { expect, test } from '@playwright/test';

test.describe('Growth Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/growth');
	});

	test('should show the new large action buttons', async ({ page }) => {
		const toothButton = page.getByTestId('tooth-button');
		const growthButton = page.getByTestId('growth-button');

		await expect(toothButton).toBeVisible();
		await expect(growthButton).toBeVisible();

		await expect(toothButton).toHaveText(/Tooth/);
		await expect(growthButton).toHaveText(/Growth/);

		// Check for large button styles
		await expect(toothButton).toHaveClass(/h-24/);
		await expect(growthButton).toHaveClass(/h-24/);
	});

	test('should open teething dialog when clicking tooth button', async ({
		page,
	}) => {
		await page.getByTestId('tooth-button').click();
		// Match either English or German text to be robust
		await expect(
			page.getByText(/Teething Progress|Zahnungsfortschritt/),
		).toBeVisible();
	});

	test('should open growth measurement form when clicking growth button', async ({
		page,
	}) => {
		await page.getByTestId('growth-button').click();
		// Match either English or German text to be robust
		await expect(
			page.getByText(/Add Growth Measurement|Wachstumsmessung hinzufügen/),
		).toBeVisible();
	});
});
