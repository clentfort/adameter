
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy as medicationRegimens } from '@/data/medication-regimens';
import { medicationsProxy as medications } from '@/data/medications';
import Papa from 'papaparse';

const dataStores: { [key: string]: any[] } = {
	diaperChanges,
	events,
	feedingSessions,
	growthMeasurements,
	medicationRegimens,
	medications,
};

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

export const getAll = () => {
	return Object.entries(dataStores).map(([name, data]) => ({
		name,
		data,
	}));
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
