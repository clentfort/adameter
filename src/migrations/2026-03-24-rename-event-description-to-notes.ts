import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export const renameEventDescriptionToNotesMigration: Migration = {
	description:
		'Rename events.description to events.notes and remove the legacy cell.',
	id: '2026-03-24-rename-event-description-to-notes',
	migrate(store) {
		let hasChanges = false;

		store.transaction(() => {
			store.forEachRow(TABLE_IDS.EVENTS, (rowId) => {
				const legacy = store.getCell(TABLE_IDS.EVENTS, rowId, 'description');
				const current = store.getCell(TABLE_IDS.EVENTS, rowId, 'notes');

				if (typeof legacy === 'string' && typeof current !== 'string') {
					store.setCell(TABLE_IDS.EVENTS, rowId, 'notes', legacy);
					hasChanges = true;
				}

				if (legacy !== undefined) {
					store.delCell(TABLE_IDS.EVENTS, rowId, 'description');
					hasChanges = true;
				}
			});
		});

		return hasChanges;
	},
};
