import type { Content, Store, Tables, Values } from 'tinybase';
import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { FeedingInProgress } from '@/types/feeding-in-progress';
import type { GrowthMeasurement } from '@/types/growth';
import { Doc, Map as YMap } from 'yjs';
import {
	LEGACY_YJS_ARRAYS,
	LEGACY_YJS_FEEDING_IN_PROGRESS_MAP,
	LEGACY_YJS_MIGRATION_COMPLETED,
	LEGACY_YJS_MIGRATION_MARKER_MAP,
	LEGACY_YJS_MIGRATION_PENDING,
	LEGACY_YJS_MIGRATION_STATUS_KEY,
	ROW_JSON_CELL,
	ROW_ORDER_CELL,
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_MIGRATED_AT,
	STORE_VALUE_MIGRATION_SOURCE,
	STORE_VALUE_MIGRATION_VERSION,
	TABLE_IDS,
	TINYBASE_MIGRATION_VERSION,
} from './constants';

type ObjectWithId = {
	id: string;
};

type MigrationSource = 'yjs-local' | 'yjs-party';

export interface LegacyYjsState {
	diaperChanges: DiaperChange[];
	events: Event[];
	feedingInProgress: {
		current: FeedingInProgress | null;
	};
	feedingSessions: FeedingSession[];
	growthMeasurements: GrowthMeasurement[];
}

interface MigrateStoreFromLegacyYjsDocOptions {
	allowOverwrite?: boolean;
	atIso?: string;
	source?: MigrationSource;
}

export function normalizeForSync<T>(value: T): T {
	return structuredClone(value);
}

export function readLegacyYjsState(doc: Doc): LegacyYjsState {
	const feedingInProgressMap = doc.getMap<FeedingInProgress | null>(
		LEGACY_YJS_FEEDING_IN_PROGRESS_MAP,
	);

	return {
		diaperChanges: normalizeForSync(
			doc
				.getArray<DiaperChange>(LEGACY_YJS_ARRAYS[TABLE_IDS.DIAPER_CHANGES])
				.toJSON(),
		),
		events: normalizeForSync(
			doc.getArray<Event>(LEGACY_YJS_ARRAYS[TABLE_IDS.EVENTS]).toJSON(),
		),
		feedingInProgress: {
			current: normalizeForSync(
				(feedingInProgressMap.get('current') as FeedingInProgress | null) ??
					null,
			),
		},
		feedingSessions: normalizeForSync(
			doc
				.getArray<FeedingSession>(LEGACY_YJS_ARRAYS[TABLE_IDS.FEEDING_SESSIONS])
				.toJSON(),
		),
		growthMeasurements: normalizeForSync(
			doc
				.getArray<GrowthMeasurement>(
					LEGACY_YJS_ARRAYS[TABLE_IDS.GROWTH_MEASUREMENTS],
				)
				.toJSON(),
		),
	};
}

export function legacyStateHasAnyData(state: LegacyYjsState) {
	return (
		state.diaperChanges.length > 0 ||
		state.events.length > 0 ||
		state.feedingSessions.length > 0 ||
		state.growthMeasurements.length > 0 ||
		state.feedingInProgress.current !== null
	);
}

export function legacyStateToTinybaseContent(
	state: LegacyYjsState,
	{
		atIso = new Date().toISOString(),
		source = 'yjs-local',
	}: {
		atIso?: string;
		source?: MigrationSource;
	} = {},
): Content {
	const tables: Tables = {
		[TABLE_IDS.DIAPER_CHANGES]: toArrayTable(state.diaperChanges),
		[TABLE_IDS.EVENTS]: toArrayTable(state.events),
		[TABLE_IDS.FEEDING_SESSIONS]: toArrayTable(state.feedingSessions),
		[TABLE_IDS.GROWTH_MEASUREMENTS]: toArrayTable(state.growthMeasurements),
	};

	const values: Values = {
		...(state.feedingInProgress.current
			? {
					[STORE_VALUE_FEEDING_IN_PROGRESS]: JSON.stringify(
						normalizeForSync(state.feedingInProgress.current),
					),
				}
			: {}),
		[STORE_VALUE_MIGRATED_AT]: atIso,
		[STORE_VALUE_MIGRATION_SOURCE]: source,
		[STORE_VALUE_MIGRATION_VERSION]: TINYBASE_MIGRATION_VERSION,
	};

	return [tables, values];
}

export function isStoreDataEmpty(store: Store) {
	const tableIds = [
		TABLE_IDS.DIAPER_CHANGES,
		TABLE_IDS.EVENTS,
		TABLE_IDS.FEEDING_SESSIONS,
		TABLE_IDS.GROWTH_MEASUREMENTS,
	] as const;

	for (const tableId of tableIds) {
		if (store.getRowCount(tableId) > 0) {
			return false;
		}
	}

	if (typeof store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) === 'string') {
		return false;
	}

	return true;
}

export function isLegacyMigrationComplete(store: Store) {
	const versionValue = store.getValue(STORE_VALUE_MIGRATION_VERSION);
	return (
		typeof versionValue === 'number' &&
		versionValue >= TINYBASE_MIGRATION_VERSION
	);
}

export function migrateStoreFromLegacyYjsDoc(
	store: Store,
	doc: Doc,
	{
		allowOverwrite = false,
		atIso,
		source = 'yjs-local',
	}: MigrateStoreFromLegacyYjsDocOptions = {},
) {
	if (!allowOverwrite && !isStoreDataEmpty(store)) {
		return {
			migrated: false,
			reason: 'tinybase-not-empty' as const,
		};
	}

	const legacyState = readLegacyYjsState(doc);
	if (!legacyStateHasAnyData(legacyState)) {
		return {
			migrated: false,
			reason: 'legacy-empty' as const,
		};
	}

	store.setContent(
		legacyStateToTinybaseContent(legacyState, { atIso, source }),
	);

	return {
		migrated: true,
		reason: 'migrated' as const,
	};
}

export function getLegacyMigrationMarker(doc: Doc): YMap<unknown> {
	return doc.getMap<unknown>(LEGACY_YJS_MIGRATION_MARKER_MAP);
}

export function getLegacyMigrationMarkerStatus(doc: Doc) {
	const status = getLegacyMigrationMarker(doc).get(
		LEGACY_YJS_MIGRATION_STATUS_KEY,
	);
	return typeof status === 'string' ? status : undefined;
}

export function ensureLegacyMigrationMarker(
	doc: Doc,
	{
		actorId,
		atIso = new Date().toISOString(),
	}: {
		actorId: string;
		atIso?: string;
	},
) {
	const marker = getLegacyMigrationMarker(doc);
	const currentStatus = marker.get(LEGACY_YJS_MIGRATION_STATUS_KEY);
	if (typeof currentStatus === 'string') {
		return false;
	}

	doc.transact(() => {
		marker.set(LEGACY_YJS_MIGRATION_STATUS_KEY, LEGACY_YJS_MIGRATION_PENDING);
		marker.set('triggeredAt', atIso);
		marker.set('triggeredBy', actorId);
		marker.set('version', TINYBASE_MIGRATION_VERSION);
	});

	return true;
}

export function completeLegacyMigrationMarker(
	doc: Doc,
	atIso = new Date().toISOString(),
) {
	const marker = getLegacyMigrationMarker(doc);
	if (
		marker.get(LEGACY_YJS_MIGRATION_STATUS_KEY) ===
		LEGACY_YJS_MIGRATION_COMPLETED
	) {
		return;
	}

	doc.transact(() => {
		marker.set(LEGACY_YJS_MIGRATION_STATUS_KEY, LEGACY_YJS_MIGRATION_COMPLETED);
		marker.set('completedAt', atIso);
	});
}

function toArrayTable<T extends ObjectWithId>(items: T[]) {
	const table: Tables[string] = {};
	for (const [order, item] of items.entries()) {
		const normalized = normalizeForSync(item);
		table[normalized.id] = {
			[ROW_JSON_CELL]: JSON.stringify(normalized),
			[ROW_ORDER_CELL]: order,
		};
	}
	return table;
}

