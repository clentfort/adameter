
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
