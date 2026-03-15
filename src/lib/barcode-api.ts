interface ProductInfo {
	name?: string;
}

export async function lookupProductByBarcode(
	barcode: string,
): Promise<ProductInfo | null> {
	try {
		// Try Open Food Facts (it also has non-food items sometimes, or there's Open Products Facts)
		// We use world.openproductsfacts.org for general products
		const response = await fetch(
			`https://world.openproductsfacts.org/api/v0/product/${barcode}.json`,
		);

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as {
			product?: { product_name?: string };
			status: number;
		};

		if (data.status === 1 && data.product?.product_name) {
			return { name: data.product.product_name };
		}

		// Fallback to Open Food Facts just in case
		const offResponse = await fetch(
			`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
		);

		if (offResponse.ok) {
			const offData = (await offResponse.json()) as {
				product?: { product_name?: string };
				status: number;
			};
			if (offData.status === 1 && offData.product?.product_name) {
				return { name: offData.product.product_name };
			}
		}

		return null;
	} catch (error) {
		console.error('Error looking up product by barcode:', error);
		return null;
	}
}
