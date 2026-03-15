import { expect, test } from './fixtures/test';

test.describe('Diaper Products Settings', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/settings/diapers');
	});

	test('should have scan button and be able to add a product with barcode', async ({
		page,
	}) => {
		// Verify the main scan button exists
		await expect(page.locator('button:has(svg.lucide-scan-barcode)')).toBeVisible();

		// Click Add Product
		await page.getByRole('button', { name: 'Add Product' }).click();

		// Verify barcode field exists
		await expect(page.getByLabel('Barcode')).toBeVisible();
		await expect(page.locator('button:has(svg.lucide-scan-barcode)')).toBeVisible();

		// Fill the form
		await page.getByLabel('Barcode').fill('4015400736412');
		await page.getByLabel('Product Name').fill('Pampers Premium Protection');
		await page.getByLabel('Cost per Diaper').fill('0.35');

		// Save
		await page.getByRole('button', { name: 'Save' }).click();

		// Verify it appears in the list
		await expect(page.getByText('Pampers Premium Protection')).toBeVisible();
		// Default currency is GBP (£)
		await expect(page.getByText('Cost per item: £0.35')).toBeVisible();
	});

	test('should open scanner dialog from main button', async ({ page }) => {
		await page.locator('button:has(svg.lucide-scan-barcode)').click();
		await expect(page.getByRole('dialog')).toBeVisible();
		await expect(page.getByText('Scan Barcode')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Start Barcode Scanner' })).toBeVisible();

		// Close it
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});

	test('should open scanner dialog from form button', async ({ page }) => {
		await page.getByRole('button', { name: 'Add Product' }).click();
		await page.locator('button:has(svg.lucide-scan-barcode)').click();

		await expect(page.getByRole('dialog')).toBeVisible();
		await expect(page.getByText('Scan Barcode')).toBeVisible();
	});
});
