import type { Store } from 'tinybase';
import { STORE_VALUE_FEEDING_IN_PROGRESS, TABLE_IDS } from './constants';

export function isStoreDataEmpty(store: Store) {
	const tableIds = [
		TABLE_IDS.DIAPER_CHANGES,
		TABLE_IDS.EVENTS,
		TABLE_IDS.FEEDING_SESSIONS,
		TABLE_IDS.GROWTH_MEASUREMENTS,
	] as const;

	for (const tableId of tableIds) {
		if (store.getRowCount(tableId) > 0) {
			return false;
		}
	}

	if (typeof store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) === 'string') {
		return false;
	}

	return true;
}
