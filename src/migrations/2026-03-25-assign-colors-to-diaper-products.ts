import type { Migration } from './types';
import { PRODUCT_COLORS } from '@/constants/colors';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export const assignColorsToDiaperProductsMigration: Migration = {
	description: 'Assign a color to existing diaper products.',
	id: '2026-03-25-assign-colors-to-diaper-products',
	migrate(store) {
		let hasChanges = false;
		let colorIndex = 0;

		store.transaction(() => {
			store.forEachRow(TABLE_IDS.DIAPER_PRODUCTS, (rowId) => {
				const currentColor = store.getCell(
					TABLE_IDS.DIAPER_PRODUCTS,
					rowId,
					'color',
				);
				if (currentColor === undefined) {
					store.setCell(
						TABLE_IDS.DIAPER_PRODUCTS,
						rowId,
						'color',
						PRODUCT_COLORS[colorIndex % PRODUCT_COLORS.length],
					);
					colorIndex++;
					hasChanges = true;
				}
			});
		});

		return hasChanges;
	},
};
