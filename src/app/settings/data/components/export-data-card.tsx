'use client';

import { fbt } from 'fbtee';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { downloadBackup } from '@/lib/backup';
import { BackupReminderState } from '@/lib/backup-reminder';

interface ExportDataCardProps {
	onBackupRecorded: (state: BackupReminderState) => void;
}

export function ExportDataCard({ onBackupRecorded }: ExportDataCardProps) {
	const { store } = useContext(tinybaseContext);
	const { toast } = useToast();
	const [isBusy, setIsBusy] = useState(false);

	const handleExport = async () => {
		setIsBusy(true);
		try {
			const state = await downloadBackup(store);
			onBackupRecorded(state);
			toast.success(
				fbt('Data exported successfully.', 'Export success message'),
			);
		} catch {
			toast.error(fbt('Failed to export data.', 'Export error message'));
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<fbt desc="Export data card title">Export Data</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="mb-4 text-sm">
					<fbt desc="Export data description">
						Download all your data as a ZIP file containing CSVs.
					</fbt>
				</p>
				<Button disabled={isBusy} onClick={handleExport}>
					{isBusy ? (
						<fbt desc="Exporting button text">Exporting...</fbt>
					) : (
						<fbt desc="Export button text">Export</fbt>
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
