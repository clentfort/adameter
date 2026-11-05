import type { CellRecord } from './cell-store';
import { describe, expect, it } from 'vitest';
import {
	CellStore,
	CellValidationError,
	getHlcTime,
	MAX_BATCH_CELLS,
	MAX_CELL_BYTES,
	parseCellBatch,
} from './cell-store';
import { createTestSqlStorage } from './test-sql-storage';

const HLC_ALPHABET =
	'-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

function hlcAt(time: number, counter = 0): string {
	let encoded = '';
	for (let shift = 36; shift >= 0; shift -= 6) {
		encoded += HLC_ALPHABET[Math.floor(time / 2 ** shift) & 63];
	}
	return `${encoded}${HLC_ALPHABET[counter]}--------`;
}

function cell(overrides: Partial<CellRecord> = {}): CellRecord {
	return {
		cell: 'startTime',
		data: 'ciphertext',
		hlc: hlcAt(1000),
		kind: 't',
		row: 'row-1',
		table: 'feedingSessions',
		...overrides,
	};
}

function createStore() {
	const { sql, transactionSync } = createTestSqlStorage();
	return new CellStore(sql, transactionSync);
}

describe('getHlcTime', () => {
	it('decodes the wall-clock time of an HLC', () => {
		expect(getHlcTime(hlcAt(1_762_300_000_000))).toBe(1_762_300_000_000);
	});
});

describe('CellStore', () => {
	it('starts empty', () => {
		const store = createStore();

		expect(store.getHead()).toBe(0);
		expect(store.list(0, 100)).toEqual({ cells: [], head: 0 });
	});

	it('accepts new cells with increasing sequence numbers', () => {
		const store = createStore();

		const result = store.put([cell(), cell({ cell: 'endTime' })]);

		expect(result.head).toBe(2);
		expect(result.accepted.map(({ seq }) => seq)).toEqual([1, 2]);
		expect(store.list(0, 100).cells).toEqual(result.accepted);
	});

	it('keeps the newer cell and ignores equal or older HLCs without a seq bump', () => {
		const store = createStore();
		store.put([cell({ data: 'new', hlc: hlcAt(2000) })]);

		const equal = store.put([cell({ data: 'other', hlc: hlcAt(2000) })]);
		const older = store.put([cell({ data: 'old', hlc: hlcAt(1000) })]);

		expect(equal).toEqual({ accepted: [], head: 1 });
		expect(older).toEqual({ accepted: [], head: 1 });
		expect(store.list(0, 100).cells).toEqual([
			expect.objectContaining({ data: 'new', seq: 1 }),
		]);
	});

	it('lets a deletion replace an older value', () => {
		const store = createStore();
		store.put([cell({ data: 'value', hlc: hlcAt(1000) })]);

		store.put([cell({ data: 'deletion', hlc: hlcAt(2000) })]);

		expect(store.list(0, 100).cells).toEqual([
			expect.objectContaining({ data: 'deletion', seq: 2 }),
		]);
	});

	it('stores values separately from table cells', () => {
		const store = createStore();

		store.put([
			cell({ cell: 'currency' }),
			cell({ cell: 'currency', kind: 'v', row: '', table: '' }),
		]);

		expect(store.list(0, 100).cells).toHaveLength(2);
	});

	it('pages by sequence and moves updated cells to a later page', () => {
		const store = createStore();
		store.put(
			Array.from({ length: 5 }, (_, index) => cell({ row: `row-${index}` })),
		);

		const firstPage = store.list(0, 2);
		// row-0 is updated between pages, so it is listed again later.
		store.put([cell({ hlc: hlcAt(2000), row: 'row-0' })]);
		const secondPage = store.list(firstPage.cells.at(-1)!.seq, 2);
		const thirdPage = store.list(secondPage.cells.at(-1)!.seq, 2);

		expect(firstPage.cells.map(({ row }) => row)).toEqual(['row-0', 'row-1']);
		expect(secondPage.cells.map(({ row }) => row)).toEqual(['row-2', 'row-3']);
		expect(thirdPage.cells.map(({ row }) => row)).toEqual(['row-4', 'row-0']);
		expect(thirdPage.head).toBe(6);
	});

	it('caps the page size', () => {
		const store = createStore();
		for (let batch = 0; batch < 3; batch += 1) {
			store.put(
				Array.from({ length: 500 }, (_, index) =>
					cell({ row: `row-${batch}-${index}` }),
				),
			);
		}

		expect(store.list(0, 5000).cells).toHaveLength(1000);
	});

	it('finds cells too far in the future', () => {
		const store = createStore();
		const now = 1_762_300_000_000;

		const future = store.getFutureCells(
			[
				cell({ hlc: hlcAt(now + 4 * 60_000) }),
				cell({ hlc: hlcAt(now + 6 * 60_000), row: 'row-2' }),
			],
			now,
		);

		expect(future).toEqual([
			{ cell: 'startTime', kind: 't', row: 'row-2', table: 'feedingSessions' },
		]);
	});
});

describe('parseCellBatch', () => {
	it('accepts valid cells and drops unknown fields', () => {
		expect(parseCellBatch([{ ...cell(), extra: 1 }])).toEqual([cell()]);
	});

	it.each([
		['a non-array body', { cells: [] }],
		['a missing field', [{ ...cell(), data: undefined }]],
		['an invalid kind', [{ ...cell(), kind: 'x' }]],
		['an invalid HLC', [{ ...cell(), hlc: 'not-an-hlc' }]],
		['a value with a table ID', [{ ...cell(), kind: 'v' }]],
		['a non-object', [null]],
	])('rejects %s', (_label, body) => {
		expect(() => parseCellBatch(body)).toThrow(CellValidationError);
	});

	it('rejects too many cells and too large cells with 413', () => {
		const tooMany = Array.from({ length: MAX_BATCH_CELLS + 1 }, () => cell());
		const tooLarge = [cell({ data: 'x'.repeat(MAX_CELL_BYTES + 1) })];

		for (const body of [tooMany, tooLarge]) {
			expect(() => parseCellBatch(body)).toThrow(
				expect.objectContaining({ status: 413 }),
			);
		}
	});
});
