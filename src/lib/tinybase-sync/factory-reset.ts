import type { Store } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { TINYBASE_LOCAL_DB_NAME } from './constants';

export const backupAndClearLocalStore = async (store: Store): Promise<void> => {
	const backupDbName = `${TINYBASE_LOCAL_DB_NAME}-backup-${Date.now()}`;
	const backupPersister = createIndexedDbPersister(store, backupDbName);
	await backupPersister.save();
	await backupPersister.destroy();
	store.delTables().delValues();
	const mainPersister = createIndexedDbPersister(store, TINYBASE_LOCAL_DB_NAME);
	await mainPersister.save();
	await mainPersister.destroy();
};
