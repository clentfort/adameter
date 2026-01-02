
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

const numericColumns = new Set([
	'durationInSeconds',
	'temperature',
	'weight',
	'height',
	'headCircumference',
	'dosageAmount',
]);

const booleanColumns = new Set([
	'containsUrine',
	'containsStool',
	'leakage',
	'isDiscontinued',
]);

export const fromCsv = (csv: string) => {
	const parsed = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
		transform: (value, field) => {
			const fieldName = field as string;
			if (numericColumns.has(fieldName)) {
				if (value.trim() === '') return null;
				const num = parseFloat(value);
				return isNaN(num) ? null : num;
			}
			if (booleanColumns.has(fieldName)) {
				const lowerValue = value.toLowerCase();
				if (lowerValue === 'true') return true;
				if (lowerValue === 'false') return false;
				return null;
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
