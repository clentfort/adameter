import type { Store } from 'tinybase';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
	TABLE_IDS,
} from './constants';

export function isStoreDataEmpty(store: Store) {
	const tableIds = Object.values(TABLE_IDS);

	for (const tableId of tableIds) {
		if (store.getRowCount(tableId) > 0) {
			return false;
		}
	}

	if (typeof store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) === 'string') {
		return false;
	}

	if (store.hasValue(STORE_VALUE_PROFILE)) {
		return false;
	}

	return true;
}
