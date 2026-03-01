import { Store } from 'tinybase';
import { ROW_JSON_CELL, TABLE_IDS } from './constants';

/**
 * Migrates data from the single 'json' cell to individual cells for all tables.
 * This allows using native TinyBase hooks and features like cell-level updates.
 */
export function migrateToJsonCells(store: Store): void {
	const tableIds = Object.values(TABLE_IDS);

	store.transaction(() => {
		for (const tableId of tableIds) {
			const table = store.getTable(tableId);
			for (const [rowId, row] of Object.entries(table)) {
				const json = row[ROW_JSON_CELL];
				if (typeof json === 'string') {
					try {
						const data = JSON.parse(json);
						if (data && typeof data === 'object') {
							// Set individual cells
							for (const [cellId, cellValue] of Object.entries(data)) {
								// TinyBase only supports string, number, boolean as cell values
								if (
									typeof cellValue === 'string' ||
									typeof cellValue === 'number' ||
									typeof cellValue === 'boolean'
								) {
									store.setCell(tableId, rowId, cellId, cellValue);
								} else if (cellValue === null || cellValue === undefined) {
									store.delCell(tableId, rowId, cellId);
								}
								// Arrays and nested objects are not supported natively in cells
								// but currently our entities (DiaperChange, FeedingSession, etc.)
								// only have flat primitives except for things we might want to keep as JSON if they were complex.
								// Based on types analysis, they are all flat.
							}
							// We keep the JSON cell for now to ensure backward compatibility during the transition
							// or we could delete it if we are sure everything is migrated.
							// For safety, let's keep it until we've updated all hooks.
						}
					} catch {
						// Ignore malformed JSON
					}
				}
			}
		}
	});
}
