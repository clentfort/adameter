import { createStore } from 'tinybase';
import { afterEach, describe, expect, it } from 'vitest';
import { applyUpdate, Doc, encodeStateAsUpdate } from 'yjs';
import {
	LEGACY_YJS_MIGRATION_PENDING,
	ROW_JSON_CELL,
	ROW_ORDER_CELL,
	STORE_VALUE_FEEDING_IN_PROGRESS,
	TABLE_IDS,
	TINYBASE_MIGRATION_VERSION,
} from './constants';
import {
	completeLegacyMigrationMarker,
	ensureLegacyMigrationMarker,
	getLegacyMigrationMarker,
	getLegacyMigrationMarkerStatus,
	isLegacyMigrationComplete,
	isStoreDataEmpty,
	legacyStateToTinybaseContent,
	migrateStoreFromLegacyYjsDoc,
	readLegacyYjsState,
} from './legacy-yjs-migration';

describe('legacy-yjs-migration', () => {
	afterEach(() => {
		// Make sure docs from failed tests do not keep update listeners around.
		for (const doc of docsToCleanup) {
			doc.destroy();
		}
		docsToCleanup.length = 0;
	});

	it('converts legacy yjs state into tinybase content', () => {
		const doc = createSeededLegacyDoc();
		docsToCleanup.push(doc);

		const state = readLegacyYjsState(doc);
		const [tables, values] = legacyStateToTinybaseContent(state, {
			atIso: '2026-02-07T12:00:00.000Z',
			source: 'yjs-party',
		});

		expect(tables[TABLE_IDS.DIAPER_CHANGES].diaper_1[ROW_ORDER_CELL]).toBe(0);
		expect(
			typeof tables[TABLE_IDS.DIAPER_CHANGES].diaper_1[ROW_JSON_CELL],
		).toBe('string');
		expect(typeof values[STORE_VALUE_FEEDING_IN_PROGRESS]).toBe('string');
		expect(values.migrationVersion).toBe(TINYBASE_MIGRATION_VERSION);
		expect(values.migrationSource).toBe('yjs-party');
		expect(values.migratedAt).toBe('2026-02-07T12:00:00.000Z');
	});

	it('sets marker only once and supports completion marker', () => {
		const doc = new Doc();
		docsToCleanup.push(doc);

		expect(
			ensureLegacyMigrationMarker(doc, {
				actorId: 'user-one',
				atIso: '2026-02-07T13:00:00.000Z',
			}),
		).toBe(true);
		expect(
			ensureLegacyMigrationMarker(doc, {
				actorId: 'user-two',
				atIso: '2026-02-07T13:01:00.000Z',
			}),
		).toBe(false);

		const marker = getLegacyMigrationMarker(doc);
		expect(marker.get('status')).toBe(LEGACY_YJS_MIGRATION_PENDING);
		expect(marker.get('triggeredBy')).toBe('user-one');

		completeLegacyMigrationMarker(doc, '2026-02-07T13:02:00.000Z');
		expect(getLegacyMigrationMarkerStatus(doc)).toBe('completed');
		expect(marker.get('completedAt')).toBe('2026-02-07T13:02:00.000Z');
	});

	it('migrates an empty tinybase store from legacy yjs data', () => {
		const doc = createSeededLegacyDoc();
		docsToCleanup.push(doc);
		const store = createStore();

		expect(isStoreDataEmpty(store)).toBe(true);
		const result = migrateStoreFromLegacyYjsDoc(store, doc, {
			atIso: '2026-02-07T14:00:00.000Z',
			source: 'yjs-party',
		});

		expect(result).toEqual({ migrated: true, reason: 'migrated' });
		expect(isStoreDataEmpty(store)).toBe(false);
		expect(isLegacyMigrationComplete(store)).toBe(true);
		expect(store.getValue('migrationSource')).toBe('yjs-party');
		expect(store.getValue('migratedAt')).toBe('2026-02-07T14:00:00.000Z');
	});

	it('does not overwrite existing tinybase content by default', () => {
		const doc = createSeededLegacyDoc();
		docsToCleanup.push(doc);
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, 'existing', {
			[ROW_JSON_CELL]: JSON.stringify({
				id: 'existing',
				startDate: '2026-02-07T09:00:00.000Z',
				title: 'Existing tinybase row',
				type: 'point',
			}),
			[ROW_ORDER_CELL]: 0,
		});

		const result = migrateStoreFromLegacyYjsDoc(store, doc);
		expect(result).toEqual({
			migrated: false,
			reason: 'tinybase-not-empty',
		});
		expect(store.hasRow(TABLE_IDS.EVENTS, 'existing')).toBe(true);
	});

	it('supports party-wide marker migration across users', () => {
		const userOneDoc = createSeededLegacyDoc();
		const userTwoDoc = new Doc();
		docsToCleanup.push(userOneDoc, userTwoDoc);
		const disconnect = connectDocs(userOneDoc, userTwoDoc);

		const storeOne = createStore();
		const storeTwo = createStore();

		expect(
			ensureLegacyMigrationMarker(userOneDoc, {
				actorId: 'first-user',
				atIso: '2026-02-07T15:00:00.000Z',
			}),
		).toBe(true);
		expect(getLegacyMigrationMarkerStatus(userTwoDoc)).toBe('pending');

		expect(
			migrateStoreFromLegacyYjsDoc(storeOne, userOneDoc, {
				atIso: '2026-02-07T15:00:30.000Z',
				source: 'yjs-party',
			}).migrated,
		).toBe(true);
		expect(
			migrateStoreFromLegacyYjsDoc(storeTwo, userTwoDoc, {
				atIso: '2026-02-07T15:00:30.000Z',
				source: 'yjs-party',
			}).migrated,
		).toBe(true);

		completeLegacyMigrationMarker(userOneDoc, '2026-02-07T15:01:00.000Z');
		expect(getLegacyMigrationMarkerStatus(userTwoDoc)).toBe('completed');

		expect(storeOne.getContent()).toEqual(storeTwo.getContent());

		disconnect();
	});
});

const docsToCleanup: Doc[] = [];

function createSeededLegacyDoc() {
	const doc = new Doc();

	doc.getArray('diaper-changes-dec').push([
		{
			containsStool: false,
			containsUrine: true,
			id: 'diaper_1',
			timestamp: '2026-02-07T08:00:00.000Z',
		},
	]);

	doc.getArray('events-dec').push([
		{
			id: 'event_1',
			startDate: '2026-02-07T08:30:00.000Z',
			title: 'Checkup',
			type: 'point',
		},
	]);

	doc.getArray('feeding-sessions-dec').push([
		{
			breast: 'left',
			durationInSeconds: 420,
			endTime: '2026-02-07T09:15:00.000Z',
			id: 'feeding_1',
			startTime: '2026-02-07T09:08:00.000Z',
		},
	]);

	doc.getArray('growth-measurments-dec').push([
		{
			date: '2026-02-07T00:00:00.000Z',
			height: 54,
			id: 'growth_1',
			weight: 4300,
		},
	]);

	doc.getArray('medication-regimens-dec').push([
		{
			dosageAmount: 1,
			dosageUnit: 'ml',
			id: 'regimen_1',
			name: 'Vitamin D',
			prescriber: 'Doctor',
			schedule: {
				times: ['10:00'],
				type: 'daily',
			},
			startDate: '2026-02-01T00:00:00.000Z',
		},
	]);

	doc.getArray('medications-dec').push([
		{
			administrationStatus: 'On Time',
			dosageAmount: 1,
			dosageUnit: 'ml',
			id: 'med_1',
			medicationName: 'Vitamin D',
			regimenId: 'regimen_1',
			timestamp: '2026-02-07T10:00:00.000Z',
		},
	]);

	doc.getMap('feeding-in-progress-dec').set('current', {
		breast: 'right',
		startTime: '2026-02-07T10:30:00.000Z',
	});

	return doc;
}

function connectDocs(left: Doc, right: Doc) {
	const leftListener = (update: Uint8Array, origin: unknown) => {
		if (origin === right) {
			return;
		}
		applyUpdate(right, update, left);
	};

	const rightListener = (update: Uint8Array, origin: unknown) => {
		if (origin === left) {
			return;
		}
		applyUpdate(left, update, right);
	};

	left.on('update', leftListener);
	right.on('update', rightListener);

	applyUpdate(right, encodeStateAsUpdate(left), left);

	return () => {
		left.off('update', leftListener);
		right.off('update', rightListener);
	};
}
