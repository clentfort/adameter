import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export const backfillDiaperChangeCostMigration: Migration = {
	description:
		'Backfill cost field for existing diaper changes based on product cost',
	id: '2026-05-20-backfill-diaper-change-cost',
	migrate: (store) => {
		const products = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
		const changes = store.getTable(TABLE_IDS.DIAPER_CHANGES);
		let hasChanged = false;

		for (const [changeId, change] of Object.entries(changes)) {
			const productId = change.diaperProductId as string | undefined;
			if (productId && products[productId]) {
				const costPerDiaper = products[productId].costPerDiaper as
					| number
					| undefined;
				if (typeof costPerDiaper === 'number' && change.cost === undefined) {
					store.setCell(
						TABLE_IDS.DIAPER_CHANGES,
						changeId,
						'cost',
						costPerDiaper,
					);
					hasChanged = true;
				}
			}
		}

		return hasChanged;
	},
};
