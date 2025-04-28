import { compareDesc } from 'date-fns';
import { SetStateAction, WritableAtom } from 'jotai/vanilla';
import JSZip from 'jszip';
import { Locale } from '@/i18n';
import { DiaperChange } from '@/types/diaper';
import { Event } from '@/types/event';
import { FeedingSession } from '@/types/feeding';
import { FeedingInProgress } from '@/types/feeding-in-progress';
import { GrowthMeasurement } from '@/types/growth';

export async function importDataFromUrl(url: string) {
	const params = new URL(url).hash.slice(1);
	const zip = new URLSearchParams(params).get('data')!.replaceAll(' ', '+');

	if (!zip) {
		throw new Error('No data found in URL');
	}

	const data = await defalteData(zip);

	const { diaperChanges, events, measurements, sessions, userSettings } = data;

	let feedingInProgress: FeedingInProgress | undefined;

	if (userSettings.storedBreast && userSettings.storedStartTime) {
		feedingInProgress = {
			breast: userSettings.storedBreast as 'left' | 'right',
			startTime: userSettings.storedStartTime,
		};
	}
	const locale: Locale =
		userSettings.storedLanguage === 'de' ? 'de_DE' : 'en_US';

	return {
		diaperChanges,
		events,
		feedingInProgress,
		measurements,
		preferredLanguage: locale,
		sessions,
	};
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
	atom: WritableAtom<T[], [SetStateAction<T[]>], void>,
	items: T[],
): void {
	const currentItems = atom.read();
	for (const item of items) {
		if (currentItems.some((i) => i.id === item.id)) {
			continue;
		}
		currentItems.unshift(item);
	}

	currentItems.sort((a, b) => {
		const aId = new Date(Number.parseInt(a.id));
		const bId = new Date(Number.parseInt(b.id));

		return compareDesc(aId, bId);
	});
}
