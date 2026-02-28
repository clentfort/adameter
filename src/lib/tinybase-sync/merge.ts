import type { Content, Store } from 'tinybase';
import { ROW_JSON_CELL, TABLE_IDS } from './constants';

/**
 * Merges a snapshot into the current store.
 * Only adds rows that don't exist in the current store.
 * Attaches the current deviceId to all merged items.
 */
export function mergeStoreContent(
	store: Store,
	snapshot: Content,
	deviceId: string,
): void {
	const [tables, values] = snapshot;

	if (tables) {
		const allowedTableIds = Object.values(TABLE_IDS) as string[];

		for (const [tableId, table] of Object.entries(tables)) {
			if (!allowedTableIds.includes(tableId)) {
				continue;
			}

			for (const [rowId, row] of Object.entries(table)) {
				// If the row doesn't exist in the current store, we "bring" it
				if (!store.hasRow(tableId, rowId)) {
					// We prefer cell-level data if available, but keep supporting JSON for transition
					const rowData: Record<string, string | number | boolean> = {
						...row,
						deviceId,
					};

					// If there's JSON but no individual cells (older version), we unpack it
					const json = row[ROW_JSON_CELL];
					if (typeof json === 'string' && Object.keys(row).length === 1) {
						try {
							const data = JSON.parse(json);
							if (data && typeof data === 'object') {
								for (const [cellId, cellValue] of Object.entries(data)) {
									if (
										typeof cellValue === 'string' ||
										typeof cellValue === 'number' ||
										typeof cellValue === 'boolean'
									) {
										rowData[cellId] = cellValue;
									}
								}
								rowData.deviceId = deviceId;
							}
						} catch {
							// Ignore malformed JSON
						}
					}

					store.setRow(tableId, rowId, rowData);
				}
			}
		}
	}

	if (values) {
		for (const [valueId, value] of Object.entries(values)) {
			// If the local store doesn't have this value, we take it from remote
			// For values like 'profile', we might want more sophisticated merging,
			// but for now, first-come-first-served (prefer existing local if present)
			// Actually, if we are joining a room that HAS data, we might want to prefer the room's data
			// but JoinStrategy 'merge' usually means keep what we have and add what's missing.
			if (!store.hasValue(valueId)) {
				store.setValue(valueId, value);
			}
		}
	}
}
