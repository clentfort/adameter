'use client';

import { fbt } from 'fbtee';
import { useEffect, useState } from 'react';
import {
	BackupReminderState,
	readBackupReminderState,
} from '@/lib/backup-reminder';
import { SettingsHeader } from '../components/settings-header';
import { BackupReminderCard } from './components/backup-reminder-card';
import { ExportDataCard } from './components/export-data-card';
import { FactoryResetCard } from './components/factory-reset-card';
import { ImportDataCard } from './components/import-data-card';

export default function DataSettingsPage() {
	const [backupReminder, setBackupReminder] = useState<BackupReminderState>();

	useEffect(() => {
		setBackupReminder(readBackupReminderState());
	}, []);

	return (
		<>
			<SettingsHeader
				title={fbt('Data Management', 'Title for data settings section')}
			/>

			<div className="space-y-4 w-full">
				<ExportDataCard onBackupRecorded={setBackupReminder} />
				<BackupReminderCard
					onChange={setBackupReminder}
					state={backupReminder}
				/>
				<ImportDataCard />
				<FactoryResetCard />
			</div>
		</>
	);
}
