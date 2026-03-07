import type { Store } from 'tinybase';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import type { Migration } from '../types';

export const fixDiaperProductCostsMigration: Migration = {
	description: 'Fixes diaper product costs that were incorrectly stored as strings',
	id: '2026-03-07-fix-diaper-product-costs',
	migrate: (store: Store) => {
		if (!store.hasTable(TABLE_IDS.DIAPER_PRODUCTS)) {
			return;
		}

		store.transaction(() => {
			const table = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
			for (const [rowId, row] of Object.entries(table)) {
				const updates: Record<string, number> = {};

				if (typeof row.costPerDiaper === 'string') {
					const num = parseFloat(row.costPerDiaper);
					if (!isNaN(num)) {
						updates.costPerDiaper = num;
					}
				}

				if (typeof row.upfrontCost === 'string') {
					const num = parseFloat(row.upfrontCost);
					if (!isNaN(num)) {
						updates.upfrontCost = num;
					}
				}

				if (Object.keys(updates).length > 0) {
					store.setPartialRow(TABLE_IDS.DIAPER_PRODUCTS, rowId, updates as any);
				}
			}
		});
	},
};
