import type { Store } from 'tinybase';
import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeImportedRow } from '@/lib/tinybase-sync/entity-row-schemas';

export const normalizeEntityStoreRowsMigration: Migration = {
	description:
		'Normalize persisted entity rows and remove rows that fail current schema validation.',
	id: '2026-03-07-normalize-entity-store-rows',
	migrate(store: Store) {
		let hasChanges = false;

		store.transaction(() => {
			for (const tableId of Object.values(TABLE_IDS)) {
				for (const rowId of store.getRowIds(tableId)) {
					const row = store.getRow(tableId, rowId);
					const sanitizedRow = sanitizeImportedRow(tableId, {
						...row,
						id: rowId,
					});

					if (sanitizedRow === undefined) {
						continue;
					}

					if (sanitizedRow === null) {
						store.delRow(tableId, rowId);
						hasChanges = true;
						continue;
					}

					if (JSON.stringify(row) === JSON.stringify(sanitizedRow)) {
						continue;
					}

					store.setRow(tableId, rowId, sanitizedRow);
					hasChanges = true;
				}
			}
		});

		return hasChanges;
	},
};
