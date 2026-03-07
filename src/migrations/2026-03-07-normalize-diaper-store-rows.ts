import type { Store } from 'tinybase';
import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import type { Migration } from './types';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	sanitizeDiaperChangeForStore,
	sanitizeDiaperProductForStore,
} from '@/lib/tinybase-sync/entity-row-schemas';

function normalizeTableRows<T extends DiaperChange | DiaperProduct>(
	store: Store,
	tableId: string,
	sanitizeRow: (row: T) => Record<string, string | number | boolean> | null,
): boolean {
	const rowIds = store.getRowIds(tableId);
	let hasChanges = false;

	for (const rowId of rowIds) {
		const row = store.getRow(tableId, rowId);
		const hydratedRow = { ...row, id: rowId } as T;
		const sanitizedRow = sanitizeRow(hydratedRow);

		if (!sanitizedRow) {
			store.delRow(tableId, rowId);
			hasChanges = true;
			continue;
		}

		const currentRowJson = JSON.stringify(row);
		const sanitizedRowJson = JSON.stringify(sanitizedRow);
		if (currentRowJson === sanitizedRowJson) {
			continue;
		}

		store.setRow(tableId, rowId, sanitizedRow);
		hasChanges = true;
	}

	return hasChanges;
}

export const normalizeDiaperStoreRowsMigration: Migration = {
	description:
		'Normalize imported diaper rows so optional blank cells are removed.',
	id: '2026-03-07-normalize-diaper-store-rows',
	migrate: (store) => {
		const productsChanged = normalizeTableRows(
			store,
			TABLE_IDS.DIAPER_PRODUCTS,
			sanitizeDiaperProductForStore,
		);
		const changesChanged = normalizeTableRows(
			store,
			TABLE_IDS.DIAPER_CHANGES,
			sanitizeDiaperChangeForStore,
		);

		return productsChanged || changesChanged;
	},
};
