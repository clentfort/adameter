
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy as medicationRegimens } from '@/data/medication-regimens';
import { medicationsProxy as medications } from '@/data/medications';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Papa from 'papaparse';

const dataStores: { [key: string]: any[] } = {
	diaperChanges,
	events,
	feedingSessions,
	growthMeasurements,
	medicationRegimens,
	medications,
};

export const exportData = async () => {
	const zip = new JSZip();

	for (const [name, data] of Object.entries(dataStores)) {
		if (data.length > 0) {
			const csv = Papa.unparse(data);
			zip.file(`${name}.csv`, csv);
		}
	}

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	saveAs(zipBlob, 'adameter-export.zip');
};

export const importData = async (file: File) => {
	const zip = await JSZip.loadAsync(file);
	const promises = [];

	for (const [name, store] of Object.entries(dataStores)) {
		const file = zip.file(`${name}.csv`);
		if (file) {
			promises.push(
				file.async('string').then((content) => {
					const parsed = Papa.parse(content, {
						header: true,
						skipEmptyLines: true,
					});
					const existingIds = new Set(store.map((item) => item.id));
					const newData = parsed.data.filter(
						(item: any) => !existingIds.has(item.id),
					);
					store.push(...newData);
				}),
			);
		}
	}

	await Promise.all(promises);
};
