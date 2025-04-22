import JSZip from 'jszip';
import { diaperRepository } from '@/data/diaper-repository';
import { eventsRepository } from '@/data/events-repository';
import { feedingRepository } from '@/data/feeding-repository';
import { measurementsRepository } from '@/data/measurements-repository';
import { Repository } from '@/data/repository';
import { DiaperChange } from '@/types/diaper';
import { Event } from '@/types/event';
import { FeedingSession } from '@/types/feeding';
import { FeedingInProgress } from '@/types/feeding-in-progress';
import { GrowthMeasurement } from '@/types/growth';

const ACTIVE_BREAST_KEY = 'activeBreast';
const START_TIME_KEY = 'startTime';
const LOCAL_STORAGE_KEY = 'preferredLanguage';

export async function importDataFromUrl(url: string) {
	const params = new URL(url).hash.slice(1);
	const zip = new URLSearchParams(params).get('data')!.replaceAll(' ', '+');

	if (!zip) {
		throw new Error('No data found in URL');
	}

	const data = await defalteData(zip);

	const { diaperChanges, events, measurements, sessions, userSettings } = data;
	importDataIntoRepository(diaperRepository, diaperChanges);
	importDataIntoRepository(eventsRepository, events);
	importDataIntoRepository(feedingRepository, sessions);
	importDataIntoRepository(measurementsRepository, measurements);

	if (userSettings.storedBreast && userSettings.storedStartTime) {
		const feedingInProgress: FeedingInProgress = {
			breast: userSettings.storedBreast as 'left' | 'right',
			startTime: userSettings.storedStartTime,
		};
		localStorage.setItem(
			'feedingInProgress',
			JSON.stringify(feedingInProgress),
		);
	}
	const locale = userSettings.storedLanguage === 'de' ? 'de_DE' : 'en_US';
	localStorage.setItem(LOCAL_STORAGE_KEY, locale);
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
