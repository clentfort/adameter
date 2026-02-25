export { TINYBASE_PARTYKIT_PARTY } from './partykit-parties';

export const TINYBASE_LOCAL_DB_NAME = 'adameter-tinybase';

export const STORE_VALUE_FEEDING_IN_PROGRESS = 'feedingInProgress';
export const STORE_VALUE_PROFILE = 'profile';
export const STORE_VALUE_DIAPER_AVERAGE_COST = 'diaperAverageCost';
export const STORE_VALUE_CURRENCY = 'currency';

export const TABLE_IDS = {
	DIAPER_BRANDS: 'diaperBrands',
	DIAPER_CHANGES: 'diaperChanges',
	EVENTS: 'events',
	FEEDING_SESSIONS: 'feedingSessions',
	GROWTH_MEASUREMENTS: 'growthMeasurements',
	TEETHING: 'teething',
} as const;

export const ROW_JSON_CELL = 'json';
export const ROW_ORDER_CELL = 'order';
