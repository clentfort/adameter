import { describe, expect, it } from 'vitest';
import { ROW_JSON_CELL } from './constants';
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

	it('falls back to JSON if individual cells are missing (only ID and metadata present)', () => {
		const row = {
			deviceId: 'device-1',
			[ROW_JSON_CELL]: JSON.stringify({
				containsStool: true,
				containsUrine: true,
				timestamp: '2026-02-08T13:00:00Z',
			}),
		};
		const id = 'row-2';

		const result = fromRow<{
			containsStool: boolean;
			containsUrine: boolean;
			id: string;
			timestamp: string;
		}>(id, row);

		expect(result).toEqual({
			containsStool: true,
			containsUrine: true,
			deviceId: 'device-1',
			id: 'row-2',
			timestamp: '2026-02-08T13:00:00Z',
		});
	});

	it('strips the ROW_JSON_CELL from the result even if cells are present', () => {
		const row = {
			containsStool: true,
			[ROW_JSON_CELL]: '{"foo": "bar"}',
		};
		const result = fromRow<Record<string, unknown>>('id-1', row);
		expect(result[ROW_JSON_CELL]).toBeUndefined();
		expect(result.containsStool).toBe(true);
	});

	it('prefers individual cells over JSON data if both are present and cells are more than 2', () => {
		const row = {
			a: 1,
			b: 2,
			c: 3,
			[ROW_JSON_CELL]: JSON.stringify({ a: 10, b: 20, c: 30 }),
		};
		const result = fromRow<Record<string, unknown>>('id-1', row);
		expect(result.a).toBe(1);
		expect(result.b).toBe(2);
		expect(result.c).toBe(3);
	});
});

describe('fromTable', () => {
	it('extracts all rows from a table, including unmigrated JSON-only rows', () => {
		const table = {
			'row-1': {
				a: 1,
				b: 2,
			},
			'row-2': {
				deviceId: 'device-1',
				[ROW_JSON_CELL]: JSON.stringify({ a: 10, b: 20 }),
			},
		};

		const result = fromTable<{ a: number; b: number; id: string }>(table);

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({ a: 1, b: 2, id: 'row-1' });
		expect(result).toContainEqual({
			a: 10,
			b: 20,
			deviceId: 'device-1',
			id: 'row-2',
		});
	});
});
