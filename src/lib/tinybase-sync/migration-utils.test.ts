import { describe, expect, it } from 'vitest';
import { fromTable, toRow } from './migration-utils';

describe('toRow', () => {
	it('converts an entity to a row while stripping id and non-primitives', () => {
		const result = toRow({
			complex: { a: 1 },
			id: 'ignore-me',
			name: 'Keep Me',
			other: null,
			valid: true,
			value: 123,
		});

		expect(result).toEqual({
			name: 'Keep Me',
			valid: true,
			value: 123,
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
		expect(result).toContainEqual({ a: 10, b: 20, id: 'row-2' });
	});

	it('adds row ids to each row', () => {
		const result = fromTable<{ id: string; value: string }>({
			alpha: { value: 'first' },
		});

		expect(result).toEqual([{ id: 'alpha', value: 'first' }]);
	});
});
