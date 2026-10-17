import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { importZipIntoStore } from './import';
import { createZip } from './zip';

describe('importZipIntoStore', () => {
	it('imports tables and values from a ZIP file', async () => {
		const store = createStore();
		const mockFiles = [
			{
				content: 'id,containsUrine,containsStool\nd1,true,false',
				name: 'diaper.csv',
			},
			{
				content:
					'id,valueJson\nselectedProfileId,"""p1"""\n"","""invalid"""\nval2,123\nval3,true\nval4,invalidjson',
				name: '__values.csv',
			},
		];

		const zipBlob = await createZip(mockFiles);
		const file = new File([zipBlob], 'export.zip', {
			type: 'application/zip',
		});

		await importZipIntoStore(store, file);

		expect(store.getTable('diaper')).toEqual({
			d1: { containsStool: false, containsUrine: true },
		});
		expect(store.getValue('selectedProfileId')).toBe('p1');
		expect(store.getValue('val2')).toBe(123);
		expect(store.getValue('val3')).toBe(true);
		expect(store.getValue('val4')).toBeUndefined();
	});

	it('handles unsanitized custom cells and empty IDs gracefully', async () => {
		const store = createStore();
		const mockFiles = [
			{
				content: 'id,customCell,numCell\n,val,10\nr1,hello,42',
				name: 'customTable.csv',
			},
		];

		const zipBlob = await createZip(mockFiles);
		const file = new File([zipBlob], 'test.zip', {
			type: 'application/zip',
		});

		await importZipIntoStore(store, file);

		expect(store.getTable('customTable')).toEqual({
			r1: { customCell: 'hello', numCell: 42 },
		});
	});
});
