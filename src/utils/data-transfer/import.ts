import type { Store } from 'tinybase';
import { sanitizeImportedRow } from '@/lib/tinybase-sync/entity-row-schemas';
import { fromCsv } from './csv';
import { VALUES_EXPORT_FILE_NAME } from './export';
import { extractFiles } from './zip';

type CsvImportRow = {
	id?: unknown;
	valueJson?: unknown;
};

function isCellValue(value: unknown): value is boolean | number | string {
	return (
		typeof value === 'boolean' ||
		typeof value === 'number' ||
		typeof value === 'string'
	);
}

function parseValueFromJson(valueJson: unknown) {
	if (typeof valueJson !== 'string' || valueJson.length === 0) {
		return undefined;
	}

	try {
		const parsedValue = JSON.parse(valueJson) as unknown;
		return isCellValue(parsedValue) ? parsedValue : undefined;
	} catch {
		return undefined;
	}
}

export const importZipIntoStore = async (
	store: Store,
	file: File,
): Promise<void> => {
	const files = await extractFiles(file);

	for (const { content, name } of files) {
		const data = fromCsv(content) as CsvImportRow[];

		store.transaction(() => {
			if (name === VALUES_EXPORT_FILE_NAME) {
				for (const row of data) {
					const valueId = row.id;
					if (typeof valueId !== 'string' || valueId.length === 0) {
						continue;
					}

					const parsedValue = parseValueFromJson(row.valueJson);
					if (parsedValue !== undefined) {
						store.setValue(valueId, parsedValue);
					}
				}
				return;
			}

			for (const row of data) {
				const rowId = row.id;
				if (
					(typeof rowId !== 'string' && typeof rowId !== 'number') ||
					String(rowId).length === 0
				) {
					continue;
				}

				const normalizedRowId = String(rowId);
				const sanitizedRow = sanitizeImportedRow(name, row);
				if (sanitizedRow === null) {
					continue;
				}

				if (sanitizedRow) {
					store.setRow(name, normalizedRowId, sanitizedRow);
					continue;
				}

				for (const [cellId, cellValue] of Object.entries(row)) {
					if (cellId === 'id' || !isCellValue(cellValue)) {
						continue;
					}

					store.setCell(name, normalizedRowId, cellId, cellValue);
				}
			}
		});
	}
};
