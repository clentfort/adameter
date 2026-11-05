export { TINYBASE_PARTYKIT_PARTY } from './partykit-parties';

export const TINYBASE_LOCAL_DB_NAME = 'adameter-tinybase';
const ROOM_SYNC_STATE_DB_PREFIX = `${TINYBASE_LOCAL_DB_NAME}-sync-`;
const LOCAL_STORE_DB_PREFIX = `${TINYBASE_LOCAL_DB_NAME}-store-`;

/** The IndexedDB database of a local store created by a reset. */
export function getLocalStoreDbName(localStoreId: string): string {
	return `${LOCAL_STORE_DB_PREFIX}${localStoreId}`;
}

export function isLocalStoreDbName(name: string): boolean {
	return name.startsWith(LOCAL_STORE_DB_PREFIX);
}

/**
 * The IndexedDB database with a room's sync state for the current local store.
 * A reset local store gets a new ID, so it never reuses stale state.
 */
export function getRoomSyncStateDbName(
	localStoreId: string,
	roomHash: string,
): string {
	return `${ROOM_SYNC_STATE_DB_PREFIX}${localStoreId}-${roomHash}`;
}

export function isRoomSyncStateDbName(name: string): boolean {
	return name.startsWith(ROOM_SYNC_STATE_DB_PREFIX);
}

export const STORE_VALUE_CURRENCY = 'currency';
export const STORE_VALUE_DEV_MODE = 'devMode';
export const STORE_VALUE_FEEDING_IN_PROGRESS = 'feedingInProgress';
export const STORE_VALUE_LOCATION_TRACKING = 'locationTracking';
export const STORE_VALUE_PROFILE = 'profile';
export const STORE_VALUE_SELECTED_PROFILE_ID = 'selectedProfileId';
export const STORE_VALUE_SHOW_FEEDING = 'showFeeding';
export const STORE_VALUE_TIME_FORMAT = 'timeFormat';
export const STORE_VALUE_UNIT_SYSTEM = 'unitSystem';

export const TABLE_IDS = {
	DIAPER_CHANGES: 'diaperChanges',
	DIAPER_PRODUCTS: 'diaperProducts',
	EVENTS: 'events',
	FEEDING_SESSIONS: 'feedingSessions',
	GROWTH_MEASUREMENTS: 'growthMeasurements',
	PROFILES: 'profiles',
	TEETHING: 'teething',
} as const;

export const INTERNAL_TABLE_IDS = {
	MIGRATIONS: '_migrations',
} as const;

export const MIGRATION_ROW_CELLS = {
	APPLIED_AT: 'appliedAt',
	APPLIED_BY_DEVICE_ID: 'appliedByDeviceId',
	DESCRIPTION: 'description',
} as const;

export const ROW_ORDER_CELL = 'order';
