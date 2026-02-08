export {
	LEGACY_YJS_PARTYKIT_PARTY,
	TINYBASE_PARTYKIT_PARTY,
} from './partykit-parties';

export const TINYBASE_LOCAL_DB_NAME = 'adameter-tinybase';

export const TINYBASE_MIGRATION_VERSION = 1;
export const STORE_VALUE_MIGRATION_VERSION = 'migrationVersion';
export const STORE_VALUE_MIGRATION_SOURCE = 'migrationSource';
export const STORE_VALUE_MIGRATED_AT = 'migratedAt';

export const TABLE_IDS = {
	DIAPER_CHANGES: 'diaperChanges',
	EVENTS: 'events',
	FEEDING_SESSIONS: 'feedingSessions',
	FEEDING_IN_PROGRESS: 'feedingInProgress',
	GROWTH_MEASUREMENTS: 'growthMeasurements',
	MEDICATION_REGIMENS: 'medicationRegimens',
	MEDICATIONS: 'medications',
} as const;

export const ROW_JSON_CELL = 'json';
export const ROW_ORDER_CELL = 'order';
export const FEEDING_IN_PROGRESS_ROW_ID = 'current';

export const LEGACY_YJS_ARRAYS = {
	[TABLE_IDS.DIAPER_CHANGES]: 'diaper-changes-dec',
	[TABLE_IDS.EVENTS]: 'events-dec',
	[TABLE_IDS.FEEDING_SESSIONS]: 'feeding-sessions-dec',
	[TABLE_IDS.GROWTH_MEASUREMENTS]: 'growth-measurments-dec',
	[TABLE_IDS.MEDICATION_REGIMENS]: 'medication-regimens-dec',
	[TABLE_IDS.MEDICATIONS]: 'medications-dec',
} as const;

export const LEGACY_YJS_FEEDING_IN_PROGRESS_MAP = 'feeding-in-progress-dec';

export const LEGACY_YJS_MIGRATION_MARKER_MAP = 'tinybase-migration-v1';
export const LEGACY_YJS_MIGRATION_STATUS_KEY = 'status';
export const LEGACY_YJS_MIGRATION_PENDING = 'pending';
export const LEGACY_YJS_MIGRATION_COMPLETED = 'completed';
