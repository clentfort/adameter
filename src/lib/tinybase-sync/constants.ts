export { TINYBASE_PARTYKIT_PARTY } from './partykit-parties';

export const TINYBASE_LOCAL_DB_NAME = 'adameter-tinybase';

export const STORE_VALUE_CURRENCY = 'currency';
export const STORE_VALUE_DEV_MODE = 'devMode';
export const STORE_VALUE_FEEDING_IN_PROGRESS = 'feedingInProgress';
export const STORE_VALUE_PROFILE = 'profile';
export const STORE_VALUE_SELECTED_PROFILE_ID = 'selectedProfileId';
export const STORE_VALUE_SHOW_FEEDING = 'showFeeding';

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
