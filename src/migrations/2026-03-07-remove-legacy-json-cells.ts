import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

const LEGACY_JSON_CELL = 'json';

export const removeLegacyJsonCellsMigration: Migration = {
	description:
		'Remove legacy TinyBase json backup cells from all persisted tables.',
	id: '2026-03-07-remove-legacy-json-cells',
	migrate(store) {
		let hasChanges = false;

		store.transaction(() => {
			for (const tableId of Object.values(TABLE_IDS)) {
				store.forEachRow(tableId, (rowId) => {
					if (store.getCell(tableId, rowId, LEGACY_JSON_CELL) === undefined) {
						return;
					}

					store.delCell(tableId, rowId, LEGACY_JSON_CELL);
					hasChanges = true;
				});
			}
		});

		return hasChanges;
	},
};
