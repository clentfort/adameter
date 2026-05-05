import type { Content, Store } from 'tinybase';
import { STORE_VALUE_SELECTED_PROFILE_ID, TABLE_IDS } from './constants';

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
					const rowData: Record<string, string | number | boolean> = {
						...row,
						deviceId,
					};

					store.setRow(tableId, rowId, rowData);
				}
			}
		}
	}

	if (values) {
		for (const [valueId, value] of Object.entries(values)) {
			// Special handling for selectedProfileId: if we already have one, keep it.
			// This ensures that our local "active" child isn't switched just because
			// we joined a room where someone else had a different active child.
			if (valueId === STORE_VALUE_SELECTED_PROFILE_ID) {
				if (!store.hasValue(valueId) || store.getValue(valueId) === '') {
					store.setValue(valueId, value);
				}
				continue;
			}

			// If the local store doesn't have this value, we take it from remote
			// For values like 'profile', we might want more sophisticated merging,
			// but for now, first-come-first-served (prefer existing local if present)
			// Actually, if we are joining a room that HAS data, we might want to prefer the room's data
			// but JoinStrategy 'merge' usually means keep what we have and add what's missing.
			if (!store.hasValue(valueId) || store.getValue(valueId) === '') {
				store.setValue(valueId, value);
			}
		}
	}
}
