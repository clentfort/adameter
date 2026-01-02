
import Papa from 'papaparse';

const columns: { [key: string]: string[] } = {
	diaperChanges: [
		'id',
		'timestamp',
		'containsUrine',
		'containsStool',
		'abnormalities',
		'diaperBrand',
		'leakage',
		'temperature',
	],
	events: [
		'id',
		'startDate',
		'endDate',
		'title',
		'description',
		'color',
		'type',
	],
	feedingSessions: ['id', 'startTime', 'endTime', 'durationInSeconds', 'breast'],
	growthMeasurements: [
		'id',
		'date',
		'weight',
		'height',
		'headCircumference',
		'notes',
	],
	medicationRegimens: [
		'id',
		'name',
		'dosageAmount',
		'dosageUnit',
		'startDate',
		'endDate',
		'isDiscontinued',
		'notes',
		'prescriber',
		'prescriberName',
		'schedule',
	],
	medications: [
		'id',
		'timestamp',
		'medicationName',
		'dosageAmount',
		'dosageUnit',
		'administrationStatus',
		'details',
		'regimenId',
	],
};

export const toCsv = (name: string, data: any[]) => {
	return Papa.unparse({
		fields: columns[name],
		data: data.map((row) =>
			columns[name].reduce((acc, key) => {
				(acc as any)[key] = (row as any)[key];
				return acc;
			}, {}),
		),
	});
};

// --- Type-safe CSV Parsing ---

const requiredNumeric = new Set(['durationInSeconds', 'dosageAmount']);
const optionalNumeric = new Set([
	'temperature',
	'weight',
	'height',
	'headCircumference',
]);
const requiredBoolean = new Set(['containsUrine', 'containsStool']);
const optionalBoolean = new Set(['leakage', 'isDiscontinued']);

export const fromCsv = (csv: string) => {
	const parsed = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
		transform: (value, field) => {
			const fieldName = field as string;
			const trimmedValue = value.trim();

			// Handle numeric types
			if (requiredNumeric.has(fieldName) || optionalNumeric.has(fieldName)) {
				if (trimmedValue === '') {
					return requiredNumeric.has(fieldName) ? 0 : undefined;
				}
				const num = parseFloat(trimmedValue);
				if (isNaN(num)) {
					return requiredNumeric.has(fieldName) ? 0 : undefined;
				}
				return num;
			}

			// Handle boolean types
			if (requiredBoolean.has(fieldName) || optionalBoolean.has(fieldName)) {
				const lowerValue = trimmedValue.toLowerCase();
				if (lowerValue === 'true') return true;

				if (requiredBoolean.has(fieldName)) {
					return false; // Default for required booleans
				}

				// Optional booleans
				if (lowerValue === 'false') return false;
				return undefined; // Default for optional booleans if not 'true' or 'false'
			}

			return value;
		},
	});
	return parsed.data;
};

export const mergeData = (store: any[], data: any[]) => {
	const existingIds = new Set(store.map((item) => item.id));
	const newData = data.filter((item: any) => !existingIds.has(item.id));
	store.push(...newData);
};
