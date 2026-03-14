import type { Migration } from './types';
import {
	INTERNAL_TABLE_IDS,
	STORE_VALUE_CURRENCY,
	STORE_VALUE_DEV_MODE,
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { sanitizeImportedRow } from '@/lib/tinybase-sync/entity-row-schemas';
import { feedingInProgressSchema } from '@/types/feeding-in-progress';
import { profileSchema } from '@/types/profile';

const VALID_VALUE_IDS = new Set<string>([
	STORE_VALUE_CURRENCY,
	STORE_VALUE_DEV_MODE,
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
]);

const VALID_TABLE_IDS = new Set<string>([
	...Object.values(TABLE_IDS),
	...Object.values(INTERNAL_TABLE_IDS),
]);

export const cleanupJunkDataMigration: Migration = {
	description: 'Clean up junk data by strictly enforcing current schemas.',
	id: '2026-03-15-cleanup-junk-data',
	migrate(store) {
		let hasChanges = false;

		store.transaction(() => {
			// 1. Clean up tables and rows using entity schemas
			for (const tableId of store.getTableIds()) {
				if (!VALID_TABLE_IDS.has(tableId)) {
					store.delTable(tableId);
					hasChanges = true;
					continue;
				}

				// Only sanitize tables we have a schema for (entity tables)
				if (Object.values(TABLE_IDS).includes(tableId as any)) {
					for (const rowId of store.getRowIds(tableId)) {
						const row = store.getRow(tableId, rowId);
						const sanitizedRow = sanitizeImportedRow(tableId, {
							...row,
							id: rowId,
						});

						if (sanitizedRow === null) {
							// Row failed validation entirely
							store.delRow(tableId, rowId);
							hasChanges = true;
						} else if (sanitizedRow !== undefined) {
							// Check if the sanitized row is different from the current row.
							// sanitizeImportedRow strips any keys not in the Zod schema.
							if (JSON.stringify(row) !== JSON.stringify(sanitizedRow)) {
								store.setRow(tableId, rowId, sanitizedRow);
								hasChanges = true;
							}
						}
					}
				}
			}

			// 2. Clean up values using value schemas
			for (const valueId of store.getValueIds()) {
				if (!VALID_VALUE_IDS.has(valueId)) {
					store.delValue(valueId);
					hasChanges = true;
					continue;
				}

				if (
					valueId === STORE_VALUE_PROFILE ||
					valueId === STORE_VALUE_FEEDING_IN_PROGRESS
				) {
					const value = store.getValue(valueId);
					if (typeof value === 'string' && value !== '') {
						try {
							const parsed = JSON.parse(value);
							const schema =
								valueId === STORE_VALUE_PROFILE
									? profileSchema
									: feedingInProgressSchema;
							const result = schema.safeParse(parsed);
							if (result.success) {
								const cleanedJson = JSON.stringify(result.data);
								if (cleanedJson !== value) {
									store.setValue(valueId, cleanedJson);
									hasChanges = true;
								}
							}
						} catch {
							// If it's not valid JSON, we leave it alone or could delete it
							// given it's supposed to be a JSON string. For now, let's just skip.
						}
					}
				}
			}
		});

		return hasChanges;
	},
};
