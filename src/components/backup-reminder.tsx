'use client';

import { fbt } from 'fbtee';
import { useContext, useEffect, useState } from 'react';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { tinybaseContext } from '@/contexts/tinybase-context';
import {
	isBackupDue,
	readBackupReminderState,
	recordBackup,
	SYNC_SERVER_MOVE_NOTICE_UNTIL,
	writeBackupReminderState,
} from '@/lib/backup-reminder';
import { logger } from '@/lib/logger';
import { isStoreDataEmpty } from '@/lib/tinybase-sync/store-utils';
import { exportStoreAsZip } from '@/utils/data-transfer/export';

/**
 * Asks once a week to download a local backup, or downloads it automatically
 * when the user chose so. Can be switched off in the data settings.
 */
export function BackupReminder() {
	const { store } = useContext(tinybaseContext);
	const { toast } = useToast();
	const [isOpen, setIsOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [downloadAutomatically, setDownloadAutomatically] = useState(false);

	useEffect(() => {
		const state = readBackupReminderState();
		if (!isBackupDue(state) || isStoreDataEmpty(store)) {
			return;
		}

		if (state.mode === 'ask') {
			setIsOpen(true);
			return;
		}

		void exportStoreAsZip(store)
			.then(() => {
				recordBackup();
				toast.success(
					fbt(
						'Your weekly backup was downloaded.',
						'Toast shown after the automatic weekly backup was downloaded',
					),
				);
			})
			.catch((error: unknown) => {
				logger.error('Automatic backup failed:', error);
				setIsOpen(true);
			});
	}, [store, toast]);

	const handleDownload = async () => {
		setIsExporting(true);
		try {
			await exportStoreAsZip(store);
			recordBackup();
			writeBackupReminderState({
				mode: downloadAutomatically ? 'auto' : 'ask',
			});
			setIsOpen(false);
		} catch (error) {
			logger.error('Backup download failed:', error);
			toast.error(fbt('Failed to export data.', 'Export error message'));
		} finally {
			setIsExporting(false);
		}
	};

	const handlePostpone = () => {
		writeBackupReminderState({ lastPromptAt: Date.now() });
		setIsOpen(false);
	};

	const handleOptOut = () => {
		writeBackupReminderState({ mode: 'off' });
		setIsOpen(false);
		toast.info(
			fbt(
				'Backup reminders are off. You can turn them back on in Settings > Data Management.',
				'Toast shown after the user switched off backup reminders',
			),
		);
	};

	const showServerMoveNotice = new Date() < SYNC_SERVER_MOVE_NOTICE_UNTIL;

	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) {
					handlePostpone();
				}
			}}
			open={isOpen}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						<fbt desc="Title of the weekly backup reminder dialog">
							Back up your data
						</fbt>
					</AlertDialogTitle>
					<AlertDialogDescription>
						<span className="block space-y-2">
							{showServerMoveNotice && (
								<span className="block font-medium text-foreground">
									<fbt desc="Notice in the backup reminder that the sync server was replaced">
										We have moved to a new sync server. Your data is being
										transferred automatically, but please download a backup now
										to be safe.
									</fbt>
								</span>
							)}
							<span className="block">
								<fbt desc="Explanation in the weekly backup reminder dialog">
									Your entries live on your devices. Download a backup regularly
									so nothing is lost if a device is lost or its storage is
									cleared.
								</fbt>
							</span>
						</span>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex items-center gap-2">
					<Checkbox
						checked={downloadAutomatically}
						id="backup-reminder-auto"
						onCheckedChange={(checked) => setDownloadAutomatically(checked)}
					/>
					<Label htmlFor="backup-reminder-auto">
						<fbt desc="Checkbox label to download the weekly backup without asking">
							Download automatically every week
						</fbt>
					</Label>
				</div>
				<AlertDialogFooter>
					<Button
						data-testid="backup-reminder-opt-out"
						onClick={handleOptOut}
						variant="ghost"
					>
						<fbt desc="Button to stop showing backup reminders">
							Don&apos;t remind me
						</fbt>
					</Button>
					<Button
						data-testid="backup-reminder-postpone"
						onClick={handlePostpone}
						variant="outline"
					>
						<fbt desc="Button to postpone the backup reminder by one week">
							Next week
						</fbt>
					</Button>
					<Button
						data-testid="backup-reminder-download"
						disabled={isExporting}
						onClick={handleDownload}
					>
						<fbt desc="Button to download a backup from the backup reminder">
							Download backup
						</fbt>
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
