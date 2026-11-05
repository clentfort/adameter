import type { MergeableChanges } from 'tinybase';
import type { PlainCell } from './cells';
import { createMergeableStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	buildChanges,
	decryptCell,
	decryptCells,
	encryptCell,
	encryptCells,
	flattenChanges,
	getCellKey,
	getCellKeys,
	parseCellKey,
} from './cells';

const HLC_1 = '0000000000000000';
const HLC_2 = '0000000000000001';

function ivOf(data: string): string {
	return atob(data).slice(0, 12);
}

function tableCell(overrides: Partial<PlainCell> = {}): PlainCell {
	return {
		cell: 'startTime',
		hlc: HLC_1,
		kind: 't',
		row: 'row-1',
		table: 'feedingSessions',
		value: '2026-11-05T10:00:00.000Z',
		...overrides,
	};
}

describe('encryptCell / decryptCell', () => {
	it('round-trips table cells and values', async () => {
		const keys = await getCellKeys('room');
		const cells: PlainCell[] = [
			tableCell(),
			tableCell({ cell: 'duration', value: 42 }),
			tableCell({ cell: 'done', value: false }),
			{
				cell: 'currency',
				hlc: HLC_2,
				kind: 'v',
				row: '',
				table: '',
				value: 'EUR',
			},
		];

		for (const cell of cells) {
			const encrypted = await encryptCell(keys, cell);
			expect(encrypted.data).not.toContain(String(cell.value));
			expect(await decryptCell(keys, encrypted)).toEqual(cell);
		}
	});

	it('round-trips deletions', async () => {
		const keys = await getCellKeys('room');
		const deletion = tableCell({ value: undefined });

		const decrypted = await decryptCell(
			keys,
			await encryptCell(keys, deletion),
		);

		expect(decrypted).toEqual(deletion);
		expect('value' in decrypted).toBe(true);
		expect(decrypted.value).toBeUndefined();
	});

	it('produces the same ciphertext for the same write on every device', async () => {
		const first = await encryptCell(await getCellKeys('room'), tableCell());
		const second = await encryptCell(await getCellKeys('room'), tableCell());

		expect(second.data).toBe(first.data);
	});

	it('uses a different IV for a different value, HLC or room', async () => {
		const keys = await getCellKeys('room');
		const base = await encryptCell(keys, tableCell());

		const others = await Promise.all([
			encryptCell(keys, tableCell({ value: 'other' })),
			encryptCell(keys, tableCell({ hlc: HLC_2 })),
			encryptCell(await getCellKeys('other-room'), tableCell()),
		]);

		for (const other of others) {
			expect(ivOf(other.data)).not.toBe(ivOf(base.data));
		}
	});

	it('rejects a value moved to another cell, row, table, kind or HLC', async () => {
		const keys = await getCellKeys('room');
		const encrypted = await encryptCell(keys, tableCell());

		for (const moved of [
			{ ...encrypted, cell: 'endTime' },
			{ ...encrypted, row: 'row-2' },
			{ ...encrypted, table: 'events' },
			{ ...encrypted, kind: 'v' as const },
			{ ...encrypted, hlc: HLC_2 },
		]) {
			await expect(decryptCell(keys, moved)).rejects.toThrow();
		}
	});

	it('rejects ciphertext of another room', async () => {
		const encrypted = await encryptCell(await getCellKeys('room'), tableCell());

		await expect(
			decryptCell(await getCellKeys('other-room'), encrypted),
		).rejects.toThrow();
	});

	it('encrypts and decrypts many cells in chunks', async () => {
		const keys = await getCellKeys('room');
		const cells = Array.from({ length: 1201 }, (_, index) =>
			tableCell({ row: `row-${index}`, value: index }),
		);

		const decrypted = await decryptCells(keys, await encryptCells(keys, cells));

		expect(decrypted).toEqual(cells);
	});
});

describe('getCellKey', () => {
	it('round-trips addresses containing separators', () => {
		const address = {
			cell: 'a|b',
			kind: 't' as const,
			row: '"x"',
			table: 't,1',
		};

		expect(parseCellKey(getCellKey(address))).toEqual(address);
		expect(getCellKey(address)).not.toBe(
			getCellKey({ ...address, cell: 'b', table: 't,1|a' }),
		);
	});
});

describe('flattenChanges / buildChanges', () => {
	it('flattens content including deletions and values', () => {
		const store = createMergeableStore('store-a', () => 1_700_000_000_000);
		store.setRow('feedingSessions', 'row-1', { duration: 5, side: 'left' });
		store.setValue('currency', 'EUR');
		store.delCell('feedingSessions', 'row-1', 'side');

		const cells = flattenChanges(store.getMergeableContent());

		expect(cells).toHaveLength(3);
		expect(cells).toContainEqual(
			expect.objectContaining({ cell: 'duration', kind: 't', value: 5 }),
		);
		expect(cells).toContainEqual(
			expect.objectContaining({ cell: 'side', kind: 't', value: undefined }),
		);
		expect(cells).toContainEqual(
			expect.objectContaining({
				cell: 'currency',
				kind: 'v',
				row: '',
				table: '',
				value: 'EUR',
			}),
		);
	});

	it('flattens transaction changes', () => {
		const store = createMergeableStore('store-a');
		store.setCell('events', 'e1', 'title', 'Doctor');
		let cells: PlainCell[] = [];
		store.addDidFinishTransactionListener(() => {
			cells = flattenChanges(store.getTransactionMergeableChanges());
		});

		store.setCell('events', 'e1', 'notes', 'checkup');

		expect(cells).toEqual([
			expect.objectContaining({ cell: 'notes', row: 'e1', value: 'checkup' }),
		]);
	});

	it('rebuilds changes that converge another store to the same content', () => {
		const source = createMergeableStore('store-a');
		source.setRow('feedingSessions', 'row-1', { duration: 5, side: 'left' });
		source.setRow('events', 'e1', { title: 'Doctor' });
		source.setValue('currency', 'EUR');
		source.delRow('events', 'e1');

		const target = createMergeableStore('store-b');
		target.applyMergeableChanges(
			buildChanges(flattenChanges(source.getMergeableContent())),
		);

		expect(target.getContent()).toEqual(source.getContent());
		expect(flattenChanges(target.getMergeableContent())).toEqual(
			flattenChanges(source.getMergeableContent()),
		);
	});

	it('builds valid changes for values only and for nothing', () => {
		const store = createMergeableStore('store-a');
		const valueOnly = buildChanges([
			{
				cell: 'currency',
				hlc: HLC_1,
				kind: 'v',
				row: '',
				table: '',
				value: 'EUR',
			},
		]);
		const empty: MergeableChanges = buildChanges([]);

		store.applyMergeableChanges(empty);
		store.applyMergeableChanges(valueOnly);

		expect(store.getValues()).toEqual({ currency: 'EUR' });
	});

	it('keeps the newer cell when merging older changes', () => {
		const store = createMergeableStore('store-a');
		store.applyMergeableChanges(
			buildChanges([tableCell({ hlc: HLC_2, value: 'new' })]),
		);
		store.applyMergeableChanges(
			buildChanges([tableCell({ hlc: HLC_1, value: 'old' })]),
		);

		expect(store.getCell('feedingSessions', 'row-1', 'startTime')).toBe('new');
	});
});
