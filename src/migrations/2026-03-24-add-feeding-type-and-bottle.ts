import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export const addFeedingTypeAndBottleMigration: Migration = {
	description: 'Add feeding type and convert zero-duration sessions to bottle feedings.',
	id: '2026-03-24-add-feeding-type-and-bottle',
	migrate: (store) => {
		const tableId = TABLE_IDS.FEEDING_SESSIONS;
		if (!store.hasTable(tableId)) {
			return;
		}

		const sessionIds = store.getRowIds(tableId);
		for (const sessionId of sessionIds) {
			const duration = store.getCell(tableId, sessionId, 'durationInSeconds');
			const currentType = store.getCell(tableId, sessionId, 'type');

			if (currentType === undefined) {
				if (typeof duration === 'number' && duration === 0) {
					store.setCell(tableId, sessionId, 'type', 'bottle');
					store.setCell(tableId, sessionId, 'milkType', 'pumped');
				} else {
					store.setCell(tableId, sessionId, 'type', 'breast');
				}
			}
		}
	},
};
