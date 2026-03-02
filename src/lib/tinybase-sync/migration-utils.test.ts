import { describe, expect, it } from 'vitest';
import { fromTable } from './migration-utils';

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
