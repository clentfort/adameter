import JSZip from 'jszip';
import { Locale } from '@/i18n';

interface Result {
	diaperChanges: DiaperChangeV1[];
	events: EventV1[];
	feedingInProgress: FeedingInProgressV1 | undefined;
	measurements: GrowthMeasurementV1[];
	preferredLanguage: Locale;
	sessions: FeedingSessionV1[];
}

export function loadDataFromLocalStorage(): Result {
	const diaperChanges = getItemAndParse('diaperChanges', '[]');
	const events = getItemAndParse('events', '[]');
	const sessions = getItemAndParse('feedingSessions', '[]');
	const measurements = getItemAndParse('growthMeasurements', '[]');
	const userSettings = {
		storedBreast: localStorage.getItem('activeBreast') ?? undefined,
		storedLanguage: localStorage.getItem('preferredLanguage') ?? undefined,
		storedStartTime: localStorage.getItem('startTime') ?? undefined,
	};

	let feedingInProgress: FeedingInProgressV1 | undefined;

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

function getItemAndParse(key: string, defaultValue: string) {
	return JSON.parse(localStorage.getItem(key) ?? defaultValue);
}

export async function loadDataFromUrl(url: string): Promise<Result> {
	const params = new URL(url).hash.slice(1);
	const zip = new URLSearchParams(params).get('data')!.replaceAll(' ', '+');

	if (!zip) {
		throw new Error('No data found in URL');
	}

	const data = await defalteData(zip);

	const { diaperChanges, events, measurements, sessions, userSettings } = data;

	let feedingInProgress: FeedingInProgressV1 | undefined;

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

interface DeflatedLegacyData {
	diaperChanges: DiaperChangeV1[];
	events: EventV1[];
	measurements: GrowthMeasurementV1[];
	sessions: FeedingSessionV1[];
	userSettings: {
		storedBreast: string;
		storedLanguage: string;
		storedStartTime: string;
	};
}

async function defalteData(data: string): Promise<DeflatedLegacyData> {
	const zip = await JSZip.loadAsync(data, { base64: true });
	const json = await zip.files['data.json'].async('text');
	return JSON.parse(json);
}

interface DiaperChangeV1 {
	// Optional leakage indicator
	abnormalities?: string;
	containsStool: boolean; // ISO string
	containsUrine: boolean;
	// Optional temperature in Celsius
	diaperBrand?: string;
	id: string;
	// Optional diaper brand
	leakage?: boolean;
	temperature?: number;
	timestamp: string; // Optional notes about abnormalities
}

interface EventV1 {
	// point = single date, period = start to end date
	color?: string;
	description?: string;
	// ISO string
	endDate?: string;
	id: string;
	startDate: string;
	title: string;
	// ISO string, optional for ongoing events
	type: 'point' | 'period'; // Optional color for the event
}

interface GrowthMeasurementV1 {
	date: string;
	// in grams
	height?: number;
	id: string;
	// in centimeters
	notes?: string;
	// ISO string
	weight?: number;
}

interface FeedingSessionV1 {
	breast: 'left' | 'right';
	durationInSeconds: number;
	endTime: string;
	id: string;
	startTime: string;
}

interface FeedingInProgressV1 {
	breast: 'left' | 'right';
	startTime: string;
}
