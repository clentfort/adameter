import { Store } from 'tinybase';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { DiaperChange, DiaperProduct } from '@/types/diaper';
import { DIAPER_BRANDS } from './diaper-brands';

export function migrateDiaperChange(change: DiaperChange): DiaperChange {
	if (change.pottyUrine !== undefined && change.pottyStool !== undefined) {
		return change;
	}

	const notes = change.abnormalities?.toLowerCase() || '';
	const newChange: DiaperChange = {
		...change,
		pottyStool: change.pottyStool ?? false,
		pottyUrine: change.pottyUrine ?? false,
	};

	let hasChanges = false;

	if (
		notes.includes('urin abgehalten') ||
		notes.includes('beides abgehalten')
	) {
		newChange.pottyUrine = true;
		hasChanges = true;
	}
	if (
		notes.includes('stuhl abgehalten') ||
		notes.includes('beides abgehalten')
	) {
		newChange.pottyStool = true;
		hasChanges = true;
	}
	if (notes.includes('windel trocken')) {
		newChange.containsUrine = false;
		newChange.containsStool = false;
		hasChanges = true;
	}

	return hasChanges ? newChange : change;
}

export function migrateDiaperBrandsToProducts(store: Store): boolean {
	let hasAnyChanges = false;
	store.transaction(() => {
		const productsTable = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
		const changesTable = store.getTable(TABLE_IDS.DIAPER_CHANGES);

		const existingProducts = Object.entries(productsTable)
			.map(([id, row]) => ({ ...row, id }) as unknown as DiaperProduct)
			.filter(Boolean);

		const changes = Object.entries(changesTable)
			.map(([id, row]) => ({ ...row, id }) as unknown as DiaperChange)
			.filter(Boolean);

		// 1. Seed defaults ONLY for brand new users (no products AND no history)
		if (existingProducts.length === 0 && changes.length === 0) {
			DIAPER_BRANDS.filter((b) => b.value !== 'andere').forEach((brand) => {
				const id = crypto.randomUUID();
				const product: Omit<DiaperProduct, 'id'> = {
					isReusable: brand.value === 'stoffwindel',
					name: `${brand.label} Size 1`,
				};
				store.setRow(
					TABLE_IDS.DIAPER_PRODUCTS,
					id,
					product as unknown as Record<string, string | number | boolean>,
				);
			});
			hasAnyChanges = true;
			return;
		}

		// 2. Map existing products by name for "find or create" logic
		const productMapByName = new Map<string, string>(); // Normalized Name -> ID
		existingProducts.forEach((p) => {
			productMapByName.set(p.name.toLowerCase(), p.id);
		});

		// 3. Identify all unique brands used in history that need a product
		const brandsToMigrate = new Set<string>();
		changes.forEach((change) => {
			if (change.diaperBrand && !change.diaperProductId) {
				brandsToMigrate.add(change.diaperBrand);
			}
		});

		// 4. Create missing products for these brands
		brandsToMigrate.forEach((brandValue) => {
			const brandInfo = DIAPER_BRANDS.find((b) => b.value === brandValue);
			const rawName = brandInfo ? brandInfo.label : brandValue;
			const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
			const normalizedName = name.toLowerCase();

			if (!productMapByName.has(normalizedName)) {
				const id = crypto.randomUUID();
				const product: Omit<DiaperProduct, 'id'> = {
					isReusable: brandValue === 'stoffwindel',
					name,
				};
				store.setRow(
					TABLE_IDS.DIAPER_PRODUCTS,
					id,
					product as unknown as Record<string, string | number | boolean>,
				);
				productMapByName.set(normalizedName, id);
				hasAnyChanges = true;
			}
		});

		// 5. Update changes that need migration (flags or product IDs)
		changes.forEach((change) => {
			const flagMigrated = migrateDiaperChange(change);
			let diaperProductId = flagMigrated.diaperProductId;

			if (flagMigrated.diaperBrand && !diaperProductId) {
				const brandInfo = DIAPER_BRANDS.find(
					(b) => b.value === flagMigrated.diaperBrand,
				);
				const rawName = brandInfo
					? brandInfo.label
					: (flagMigrated.diaperBrand as string);
				const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
				diaperProductId = productMapByName.get(name.toLowerCase());
			}

			if (
				flagMigrated !== change ||
				diaperProductId !== change.diaperProductId
			) {
				const { id: _, ...updatedChange } = {
					...flagMigrated,
					diaperProductId,
				};
				store.setRow(
					TABLE_IDS.DIAPER_CHANGES,
					change.id,
					updatedChange as unknown as Record<string, string | number | boolean>,
				);
				hasAnyChanges = true;
			}
		});
	});
	return hasAnyChanges;
}
