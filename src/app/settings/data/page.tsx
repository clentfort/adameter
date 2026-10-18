'use client';

import { fbt } from 'fbtee';
import { SettingsHeader } from '../components/settings-header';
import { BackupReminderCard } from './components/backup-reminder-card';
import { ExportDataCard } from './components/export-data-card';
import { FactoryResetCard } from './components/factory-reset-card';
import { ImportDataCard } from './components/import-data-card';

export default function DataSettingsPage() {
	return (
		<>
			<SettingsHeader
				title={fbt('Data Management', 'Title for data settings section')}
			/>

			<div className="space-y-4 w-full">
				<ExportDataCard />
				<BackupReminderCard />
				<ImportDataCard />
				<FactoryResetCard />
			</div>
		</>
	);
}
