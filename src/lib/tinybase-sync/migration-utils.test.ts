import { describe, expect, it } from 'vitest';
import { fromRow, fromTable } from './migration-utils';

describe('fromRow', () => {
	it('extracts data from individual cells when present', () => {
		const row = {
			containsStool: true,
			containsUrine: false,
			timestamp: '2026-02-08T12:00:00Z',
		};
		const id = 'row-1';

		const result = fromRow<{
			containsStool: boolean;
			containsUrine: boolean;
			id: string;
			timestamp: string;
		}>(id, row);

		expect(result).toEqual({
			containsStool: true,
			containsUrine: false,
			id: 'row-1',
			timestamp: '2026-02-08T12:00:00Z',
		});
	});
});

describe('fromTable', () => {
	it('extracts all rows from a table', () => {
		const table = {
			'row-1': {
				a: 1,
				b: 2,
			},
			'row-2': {
				a: 10,
				b: 20,
			},
		};

		const result = fromTable<{ a: number; b: number; id: string }>(table);

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({ a: 1, b: 2, id: 'row-1' });
		expect(result).toContainEqual({
			a: 10,
			b: 20,
			id: 'row-2',
		});
	});
});
