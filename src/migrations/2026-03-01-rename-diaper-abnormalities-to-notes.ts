import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

/**
 * Snapshot of the diaper change shape before this migration.
 *
 * Copied from src/types/diaper.ts at migration authoring time,
 * so this migration remains understandable and stable even if current app types evolve.
 */
interface DiaperChangeBefore20260301 {
	abnormalities?: string;
	containsStool: boolean;
	containsUrine: boolean;
	deviceId?: string;
	diaperBrand?: string;
	diaperProductId?: string;
	id: string;
	leakage?: boolean;
	pottyStool?: boolean;
	pottyUrine?: boolean;
	temperature?: number;
	timestamp: string;
}

interface DiaperChangeAfter20260301 extends Omit<
	DiaperChangeBefore20260301,
	'abnormalities'
> {
	notes?: string;
}

export const renameDiaperAbnormalitiesToNotesMigration: Migration = {
	description:
		'Rename diaperChanges.abnormalities to diaperChanges.notes and remove the legacy cell.',
	id: '2026-03-01-rename-diaper-abnormalities-to-notes',
	migrate(store) {
		let hasChanges = false;

		store.transaction(() => {
			const diaperChanges = store.getTable(TABLE_IDS.DIAPER_CHANGES);

			for (const [rowId, row] of Object.entries(diaperChanges)) {
				const legacy = row.abnormalities as
					| DiaperChangeBefore20260301['abnormalities']
					| undefined;
				const current = row.notes as
					| DiaperChangeAfter20260301['notes']
					| undefined;

				if (typeof legacy === 'string' && typeof current !== 'string') {
					store.setCell(TABLE_IDS.DIAPER_CHANGES, rowId, 'notes', legacy);
					hasChanges = true;
				}

				if (row.abnormalities !== undefined) {
					store.delCell(TABLE_IDS.DIAPER_CHANGES, rowId, 'abnormalities');
					hasChanges = true;
				}
			}
		});

		return hasChanges;
	},
};
