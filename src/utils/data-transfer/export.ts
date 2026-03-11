import type { Store } from 'tinybase';
import { toCsv } from './csv';
import { createZip, downloadZip } from './zip';

const VALUES_EXPORT_FILE_NAME = '__values';

export const exportStoreAsZip = async (store: Store) => {
	const [tables, values] = store.getContent();
	const files = Object.entries(tables).map(([tableId, table]) => {
		const rows = Object.entries(table).map(([rowId, row]) => ({
			...row,
			id: rowId,
		}));

		return {
			content: toCsv(rows),
			name: `${tableId}.csv`,
		};
	});

	const valueRows = Object.entries(values).map(([valueId, value]) => ({
		id: valueId,
		valueJson: JSON.stringify(value),
	}));

	if (valueRows.length > 0) {
		files.push({
			content: toCsv(valueRows),
			name: `${VALUES_EXPORT_FILE_NAME}.csv`,
		});
	}

	const zipBlob = await createZip(files);
	downloadZip(zipBlob);
};
