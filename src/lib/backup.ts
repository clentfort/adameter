import type { Store } from 'tinybase';
import { BackupReminderState, recordBackup } from '@/lib/backup-reminder';
import { exportStoreAsZip } from '@/utils/data-transfer/export';

export async function downloadBackup(
	store: Store,
): Promise<BackupReminderState> {
	await exportStoreAsZip(store);
	return recordBackup();
}
