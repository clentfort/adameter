import { describe, expect, it, vi } from 'vitest';
import { lookupProductByBarcode } from './barcode-api';

global.fetch = vi.fn();

describe('barcode-api', () => {
	it('should return product name from Open Products Facts', async () => {
		(fetch as any).mockResolvedValueOnce({
			json: async () => ({
				product: { product_name: 'Test Product General' },
				status: 1,
			}),
			ok: true,
		});

		const result = await lookupProductByBarcode('123456789');
		expect(result).toEqual({ name: 'Test Product General' });
		expect(fetch).toHaveBeenCalledWith(
			'https://world.openproductsfacts.org/api/v0/product/123456789.json',
		);
	});

	it('should fallback to Open Food Facts if Open Products Facts fails', async () => {
		(fetch as any)
			.mockResolvedValueOnce({
				json: async () => ({ status: 0 }),
				ok: true,
			})
			.mockResolvedValueOnce({
				json: async () => ({
					product: { product_name: 'Test Product Food' },
					status: 1,
				}),
				ok: true,
			});

		const result = await lookupProductByBarcode('987654321');
		expect(result).toEqual({ name: 'Test Product Food' });
		expect(fetch).toHaveBeenCalledWith(
			'https://world.openproductsfacts.org/api/v0/product/987654321.json',
		);
		expect(fetch).toHaveBeenCalledWith(
			'https://world.openfoodfacts.org/api/v0/product/987654321.json',
		);
	});

	it('should return null if both APIs fail', async () => {
		(fetch as any).mockResolvedValue({
			json: async () => ({ status: 0 }),
			ok: true,
		});

		const result = await lookupProductByBarcode('000000000');
		expect(result).toBeNull();
	});

	it('should return null on fetch error', async () => {
		(fetch as any).mockRejectedValue(new Error('Network error'));

		const result = await lookupProductByBarcode('111111111');
		expect(result).toBeNull();
	});
});
