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
					const json = row[ROW_JSON_CELL];
					if (typeof json === 'string') {
						try {
							const data = JSON.parse(json);
							// Attach the deviceId as requested
							data.deviceId = deviceId;
							store.setRow(tableId, rowId, {
								[ROW_JSON_CELL]: JSON.stringify(data),
							});
						} catch {
							// Ignore malformed JSON
						}
					}
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
