import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { GrowthMeasurement } from '@/types/growth';
import type { Profile } from '@/types/profile';
import type { Tooth } from '@/types/teething';
import {
	diaperChangeDataSchema,
	diaperProductDataSchema,
} from '@/types/diaper';
import { eventDataSchema } from '@/types/event';
import { feedingSessionDataSchema } from '@/types/feeding';
import { growthMeasurementDataSchema } from '@/types/growth';
import { profileDataSchema } from '@/types/profile';
import { toothDataSchema } from '@/types/teething';
import { TABLE_IDS } from './constants';
import { toRow } from './migration-utils';

type CellValue = boolean | number | string;
type InputRow = Record<string, unknown>;
type SanitizedRow = Record<string, CellValue>;

function getDeviceId(row: InputRow): string | undefined {
	return typeof row.deviceId === 'string' && row.deviceId.length > 0
		? row.deviceId
		: undefined;
}

function getProfileId(row: InputRow): string | undefined {
	return typeof row.profileId === 'string' && row.profileId.length > 0
		? row.profileId
		: undefined;
}

function sanitizeRowWithSchema(
	row: InputRow,
	schema: {
		safeParse: (
			value: unknown,
		) => { data: unknown; success: true } | { success: false };
	},
): SanitizedRow | null {
	const parsedRow = schema.safeParse(row);
	if (!parsedRow.success) {
		return null;
	}

	const sanitizedRow = toRow(parsedRow.data as Record<string, unknown>);
	const deviceId = getDeviceId(row);
	if (deviceId) {
		sanitizedRow.deviceId = deviceId;
	}
	const profileId = getProfileId(row);
	if (profileId) {
		sanitizedRow.profileId = profileId;
	}

	return sanitizedRow;
}

export function sanitizeDiaperProductForStore(
	product: DiaperProduct,
): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...product }, diaperProductDataSchema);
}

export function sanitizeDiaperChangeForStore(
	change: DiaperChange,
): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...change }, diaperChangeDataSchema);
}

export function sanitizeEventForStore(event: Event): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...event }, eventDataSchema);
}

export function sanitizeFeedingSessionForStore(
	session: FeedingSession,
): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...session }, feedingSessionDataSchema);
}

export function sanitizeGrowthMeasurementForStore(
	measurement: GrowthMeasurement,
): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...measurement }, growthMeasurementDataSchema);
}

export function sanitizeToothForStore(tooth: Tooth): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...tooth }, toothDataSchema);
}

export function sanitizeProfileForStore(profile: Profile): SanitizedRow | null {
	return sanitizeRowWithSchema({ ...profile }, profileDataSchema);
}

export function sanitizeImportedRow(
	tableId: string,
	row: InputRow,
): SanitizedRow | null | undefined {
	if (tableId === TABLE_IDS.DIAPER_PRODUCTS) {
		return sanitizeRowWithSchema(row, diaperProductDataSchema);
	}

	if (tableId === TABLE_IDS.DIAPER_CHANGES) {
		return sanitizeRowWithSchema(row, diaperChangeDataSchema);
	}

	if (tableId === TABLE_IDS.EVENTS) {
		return sanitizeRowWithSchema(row, eventDataSchema);
	}

	if (tableId === TABLE_IDS.FEEDING_SESSIONS) {
		return sanitizeRowWithSchema(row, feedingSessionDataSchema);
	}

	if (tableId === TABLE_IDS.GROWTH_MEASUREMENTS) {
		return sanitizeRowWithSchema(row, growthMeasurementDataSchema);
	}

	if (tableId === TABLE_IDS.TEETHING) {
		return sanitizeRowWithSchema(row, toothDataSchema);
	}

	if (tableId === TABLE_IDS.PROFILES) {
		return sanitizeRowWithSchema(row, profileDataSchema);
	}

	return undefined;
}
