import type { Migration } from './types';
import { STORE_VALUE_SHOW_FEEDING } from '@/lib/tinybase-sync/constants';

export const setDefaultShowFeedingMigration: Migration = {
	description: 'Set default value for showFeeding to true if not present.',
	id: '2026-04-16-set-default-show-feeding',
	migrate(store) {
		if (store.getValue(STORE_VALUE_SHOW_FEEDING) === undefined) {
			store.setValue(STORE_VALUE_SHOW_FEEDING, true);
			return true;
		}
		return false;
	},
};
