import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { normalizeEntityStoreRowsMigration } from './2026-03-07-normalize-entity-store-rows';

describe('normalizeEntityStoreRowsMigration', () => {
	it('deletes rows that fail validation (e.g., missing startDate)', () => {
		const store = createStore();
		// Set an invalid event (missing startDate)
		store.setRow(TABLE_IDS.EVENTS, 'e1', {
			title: 'Invalid Event',
			type: 'point',
		});

		const result = normalizeEntityStoreRowsMigration.migrate(store);

		expect(result).toBe(true);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'e1')).toBe(false);
	});
});
