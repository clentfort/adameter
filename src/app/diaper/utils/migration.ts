import { Store } from 'tinybase';
import { ROW_JSON_CELL, TABLE_IDS } from '@/lib/tinybase-sync/constants';
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

export function migrateDiaperBrandsToProducts(store: Store) {
	const productsTable = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
	const changesTable = store.getTable(TABLE_IDS.DIAPER_CHANGES);
	const changes = Object.values(changesTable)
		.map((row) => JSON.parse(row[ROW_JSON_CELL] as string) as DiaperChange)
		.filter(Boolean);

	// Perform the legacy flag migration first for all changes
	let anyFlagChanges = false;
	const flagMigratedChanges = changes.map((change) => {
		const migrated = migrateDiaperChange(change);
		if (migrated !== change) {
			anyFlagChanges = true;
		}
		return migrated;
	});

	// If no products exist yet, we need to create them
	if (Object.keys(productsTable).length === 0) {
		const productMap = new Map<string, string>(); // name -> uuid

		if (changes.length === 0) {
			// New user: seed with default brands + " Size 1"
			DIAPER_BRANDS.filter((b) => b.value !== 'andere').forEach((brand) => {
				const id = crypto.randomUUID();
				const product: DiaperProduct = {
					id,
					isReusable: brand.value === 'stoffwindel',
					name: `${brand.label} Size 1`,
				};
				store.setRow(TABLE_IDS.DIAPER_PRODUCTS, id, {
					[ROW_JSON_CELL]: JSON.stringify(product),
				});
			});
		} else {
			// Existing user: create products from history
			const usedBrands = new Set<string>();
			changes.forEach((change) => {
				if (change.diaperBrand) {
					usedBrands.add(change.diaperBrand);
				}
			});

			usedBrands.forEach((brandValue) => {
				const brandInfo = DIAPER_BRANDS.find((b) => b.value === brandValue);
				const name = brandInfo ? brandInfo.label : brandValue;
				const id = crypto.randomUUID();
				const product: DiaperProduct = {
					id,
					isReusable: brandValue === 'stoffwindel',
					name: name.charAt(0).toUpperCase() + name.slice(1),
				};
				store.setRow(TABLE_IDS.DIAPER_PRODUCTS, id, {
					[ROW_JSON_CELL]: JSON.stringify(product),
				});
				productMap.set(brandValue, id);
			});

			// Update all changes with their new product IDs and flags
			flagMigratedChanges.forEach((change) => {
				const productId = change.diaperBrand
					? productMap.get(change.diaperBrand)
					: undefined;
				if (productId || anyFlagChanges) {
					const updatedChange = {
						...change,
						diaperProductId: productId || change.diaperProductId,
					};
					store.setRow(TABLE_IDS.DIAPER_CHANGES, change.id, {
						[ROW_JSON_CELL]: JSON.stringify(updatedChange),
					});
				}
			});
			return; // Done
		}
	}

	// If products already exist, just ensure flags are migrated if they weren't before
	if (anyFlagChanges) {
		flagMigratedChanges.forEach((change, index) => {
			if (change !== changes[index]) {
				store.setRow(TABLE_IDS.DIAPER_CHANGES, change.id, {
					[ROW_JSON_CELL]: JSON.stringify(change),
				});
			}
		});
	}
}
