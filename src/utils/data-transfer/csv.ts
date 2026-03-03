import Papa from 'papaparse';

export const toCsv = (rows: Array<Record<string, unknown>>) => {
	if (rows.length === 0) {
		return '';
	}

	const fields = getCsvFields(rows);

	return Papa.unparse({
		data: rows.map((row) =>
			fields.reduce<Record<string, unknown>>((normalizedRow, field) => {
				normalizedRow[field] = row[field] ?? '';
				return normalizedRow;
			}, {}),
		),
		fields,
	});
};

export const fromCsv = (csv: string) => {
	const parsed = Papa.parse<Record<string, string>>(csv, {
		header: true,
		skipEmptyLines: true,
	});

	return parsed.data.map((rawRow) => {
		const normalizedRow: Record<string, unknown> = {};

		for (const [fieldName, rawValue] of Object.entries(rawRow)) {
			if (!fieldName) {
				continue;
			}

			const value = typeof rawValue === 'string' ? rawValue : '';
			normalizedRow[fieldName] = parseCsvValue(value, fieldName);
		}

		if (
			typeof normalizedRow.notes !== 'string' &&
			typeof normalizedRow.abnormalities === 'string'
		) {
			normalizedRow.notes = normalizedRow.abnormalities;
		}

		if ('abnormalities' in normalizedRow) {
			delete normalizedRow.abnormalities;
		}

		return normalizedRow;
	});
};

function getCsvFields(rows: Array<Record<string, unknown>>) {
	const fieldSet = new Set<string>();

	for (const row of rows) {
		for (const field of Object.keys(row)) {
			fieldSet.add(field);
		}
	}

	const fields = [...fieldSet];
	fields.sort();

	const idIndex = fields.indexOf('id');
	if (idIndex > -1) {
		fields.splice(idIndex, 1);
		fields.unshift('id');
	}

	return fields;
}

function parseCsvValue(value: string, fieldName: string) {
	if (fieldName === 'id') {
		return value;
	}

	const trimmed = value.trim();
	const lowered = trimmed.toLowerCase();

	if (lowered === 'true') {
		return true;
	}

	if (lowered === 'false') {
		return false;
	}

	if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
		const numericValue = Number(trimmed);
		if (Number.isFinite(numericValue)) {
			return numericValue;
		}
	}

	return value;
}
