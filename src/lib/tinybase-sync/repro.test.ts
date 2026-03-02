import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS, ROW_JSON_CELL, ROW_ORDER_CELL } from './constants';
import { reconcileRemoteLoadResult, snapshotStoreContentIfNonEmpty } from './remote-bootstrap';

describe('remote-bootstrap - merge reproduction', () => {
    it('should merge local data into empty remote when strategy is merge', () => {
        const store = createStore();

        // 1. Simulate local data
        store.setRow(TABLE_IDS.EVENTS, 'local-1', {
            [ROW_JSON_CELL]: JSON.stringify({ id: 'local-1', title: 'Local Event' }),
            [ROW_ORDER_CELL]: 0,
        });
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);
        expect(localSnapshot).toBeDefined();

        // 2. Simulate joining a room (remote is empty)
        // In TinybaseProvider, we call remotePersister.load() which will clear the store if remote is empty
        store.delTables();
        expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(0);

        // 3. Reconcile with 'merge' strategy
        const result = reconcileRemoteLoadResult(store, localSnapshot, 'merge', 'test-device');

        expect(result.decision).toBe('merge');
        expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(1);
        expect(store.hasRow(TABLE_IDS.EVENTS, 'local-1')).toBe(true);
    });


    it('should merge feeding session if it has simple fields', () => {
        const store = createStore();
        const FEEDING_TABLE = TABLE_IDS.FEEDING_SESSIONS;

        // 1. Simulate local feeding data
        store.setRow(FEEDING_TABLE, 'f1', {
            id: 'f1',
            type: 'breast',
            side: 'left',
            duration: 600,
        });
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);

        store.delTables();

        // 3. Reconcile with 'merge' strategy
        reconcileRemoteLoadResult(store, localSnapshot, 'merge', 'test-device');

        expect(store.getRowCount(FEEDING_TABLE)).toBe(1);
        expect(store.getRow(FEEDING_TABLE, 'f1').side).toBe('left');
    });

    it('should merge profile value if strategy is merge', () => {
        const store = createStore();
        const PROFILE_VALUE = 'profile';

        // 1. Simulate local profile data
        store.setValue(PROFILE_VALUE, JSON.stringify({ name: 'Local' }));
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);

        store.delValues();

        // 3. Reconcile with 'merge' strategy
        reconcileRemoteLoadResult(store, localSnapshot, 'merge', 'test-device');

        expect(store.getValue(PROFILE_VALUE)).toEqual(JSON.stringify({ name: 'Local' }));
    });

    it('should NOT return decision restore-local if local is empty and remote is empty', () => {
        const store = createStore();
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);
        expect(localSnapshot).toBeUndefined();

        const result = reconcileRemoteLoadResult(store, localSnapshot, 'overwrite', 'dev');
        expect(result.decision).toBe('keep-empty');
    });

    it('should return decision restore-local if local HAD data and remote is empty', () => {
        const store = createStore();
        store.setValue('profile', 'some-data');
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);

        store.delValues();

        const result = reconcileRemoteLoadResult(store, localSnapshot, 'overwrite', 'dev');
        expect(result.decision).toBe('restore-local');
        expect(store.getValue('profile')).toBe('some-data');
    });

    it('reproduces data loss when joinRoom("room-id", "overwrite") is called', () => {
        const store = createStore();
        store.setValue('profile', 'local-user');
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);

        // Simulating TinybaseProvider with room="room-id" and joinStrategy="overwrite"
        store.delValues(); // remotePersister.load() clears local data if remote is empty

        const result = reconcileRemoteLoadResult(store, localSnapshot, 'overwrite', 'dev');

        // This actually PASSES currently, meaning it RESTORES the data.
        expect(result.decision).toBe('restore-local');
        expect(store.getValue('profile')).toBe('local-user');
    });

    it('merges migration table to prevent migration re-runs - deeper debug', () => {
        const store = createStore();
        const FEEDING_TABLE = TABLE_IDS.FEEDING_SESSIONS;
        const MIGRATIONS_TABLE = '_migrations';

        // 1. Local has data and migrations applied
        store.setRow(FEEDING_TABLE, 'f1', { id: 'f1', old_field: 'value' });
        store.setRow(MIGRATIONS_TABLE, 'mig-1', { appliedAt: 123, description: 'test' });
        const localSnapshot = snapshotStoreContentIfNonEmpty(store);

        // 2. Joining room (empty)
        store.delTables();

        // 3. Merging
        reconcileRemoteLoadResult(store, localSnapshot, 'merge', 'dev');

        // MIGRATIONS_TABLE should now be merged
        expect(store.getTableIds()).toContain(MIGRATIONS_TABLE);
        expect(store.hasRow(MIGRATIONS_TABLE, 'mig-1')).toBe(true);
    });
});
