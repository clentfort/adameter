
import Papa from 'papaparse';

export const fromCsv = (csv: string) => {
	const parsed = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
	});
	return parsed.data;
};

export const mergeData = (store: any[], data: any[]) => {
	const existingIds = new Set(store.map((item) => item.id));
	const newData = data.filter((item: any) => !existingIds.has(item.id));
	store.push(...newData);
};
