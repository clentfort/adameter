import type { Content, Store } from 'tinybase';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
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

	if (store.hasValue(STORE_VALUE_SELECTED_PROFILE_ID)) {
		return false;
	}

	return true;
}

export function snapshotStoreContentIfNonEmpty(
	store: Store,
): Content | undefined {
	if (isStoreDataEmpty(store)) {
		return undefined;
	}

	const content = store.getContent();
	if (typeof structuredClone === 'function') {
		return structuredClone(content);
	}

	return content;
}
