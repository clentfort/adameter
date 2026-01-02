
import Papa from 'papaparse';
import { isDate, isDateString } from './date';

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
				const value = (row as any)[key];
				(acc as any)[key] = isDate(value) ? value.toISOString() : value;
				return acc;
			}, {}),
		),
	});
};

export const fromCsv = (csv: string) => {
	const parsed = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
		transform: (value, field) => {
			if (isDateString(value)) {
				return new Date(value);
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
