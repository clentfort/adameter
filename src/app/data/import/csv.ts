
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

export const fromCsv = (csv: string) => {
	const parsed = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
	});
	return parsed.data;
};

export const mergeData = (name: string, data: any[]) => {
	const store = dataStores[name];
	const existingIds = new Set(store.map((item) => item.id));
	const newData = data.filter((item: any) => !existingIds.has(item.id));
	store.push(...newData);
};
