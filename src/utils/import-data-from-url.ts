import JSZip from 'jszip';
import { diaperRepository } from '@/data/diaper-repository';
import { eventsRepository } from '@/data/events-repository';
import { feedingRepository } from '@/data/feeding-repository';
import { measurementsRepository } from '@/data/measurements-repository';
import { Repository } from '@/data/repository';
import { DiaperChange } from '@/types/diaper';
import { Event } from '@/types/event';
import { FeedingSession } from '@/types/feeding';
import { GrowthMeasurement } from '@/types/growth';

const ACTIVE_BREAST_KEY = 'activeBreast';
const START_TIME_KEY = 'startTime';
const LOCAL_STORAGE_KEY = 'preferredLanguage';

export async function* importDataFromUrl(url: string) {
	const params = new URL(url).hash.slice(1);
	const zip = new URLSearchParams(params).get('data')!.replaceAll(' ', '+');

	if (!zip) {
		throw new Error('No data found in URL');
	}

	const data = await defalteData(zip);
	yield 'DEFLATED';

	const { diaperChanges, events, measurements, sessions, userSettings } = data;
	importDataIntoRepository(diaperRepository, diaperChanges);
	yield 'IMPORTED_DIAPERS';
	importDataIntoRepository(eventsRepository, events);
	yield 'IMPORTED_EVENTS';
	importDataIntoRepository(feedingRepository, sessions);
	yield 'IMPORTED_SESSIONS';
	importDataIntoRepository(measurementsRepository, measurements);
	yield 'IMPORTED_GROWTH';

	localStorage.setItem(ACTIVE_BREAST_KEY, userSettings.storedBreast);
	localStorage.setItem(START_TIME_KEY, userSettings.storedStartTime);
	const locale = userSettings.storedLanguage === 'de' ? 'de_DE' : 'en_US';
	localStorage.setItem(LOCAL_STORAGE_KEY, locale);

	return;
}

interface DecompressedData {
	diaperChanges: DiaperChange[];
	events: Event[];
	measurements: GrowthMeasurement[];
	sessions: FeedingSession[];
	userSettings: {
		storedBreast: string;
		storedLanguage: string;
		storedStartTime: string;
	};
}

async function defalteData(data: string): Promise<DecompressedData> {
	const zip = await JSZip.loadAsync(data, { base64: true });
	const json = await zip.files['data.json'].async('text');
	return JSON.parse(json);
}

function importDataIntoRepository<T extends { id: string }>(
	repository: Repository<T>,
	items: T[],
): void {
	items.forEach((item) => {
		if (!repository.getById(item.id)) {
			repository.insertAtFront(item);
		}
	});
	repository.restoreSortingOrder();
}
