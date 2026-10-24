'use client';

import { fbt } from 'fbtee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/i18n-context';
import {
	BackupReminderState,
	isBackupReminderMode,
	writeBackupReminderState,
} from '@/lib/backup-reminder';

interface BackupReminderCardProps {
	onChange: (state: BackupReminderState) => void;
	state: BackupReminderState | undefined;
}

export function BackupReminderCard({
	onChange,
	state,
}: BackupReminderCardProps) {
	const { locale } = useLanguage();

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<fbt desc="Title of the backup reminder settings card">
						Backup Reminder
					</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm">
					<fbt desc="Description of the backup reminder settings">
						Once a week, AdaMeter can remind you to download a backup or
						download it automatically.
					</fbt>
				</p>
				<RadioGroup
					onValueChange={(value) => {
						if (isBackupReminderMode(value)) {
							onChange(writeBackupReminderState({ mode: value }));
						}
					}}
					value={state?.mode ?? 'ask'}
				>
					<div className="flex items-center gap-2">
						<RadioGroupItem id="backup-reminder-ask" value="ask" />
						<Label htmlFor="backup-reminder-ask">
							<fbt desc="Backup reminder option: ask every week">
								Ask every week
							</fbt>
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem id="backup-reminder-auto" value="auto" />
						<Label htmlFor="backup-reminder-auto">
							<fbt desc="Backup reminder option: download automatically every week">
								Download automatically every week
							</fbt>
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem id="backup-reminder-off" value="off" />
						<Label htmlFor="backup-reminder-off">
							<fbt desc="Backup reminder option: never remind">Off</fbt>
						</Label>
					</div>
				</RadioGroup>
				<p className="text-sm text-muted-foreground">
					{state?.lastBackupAt ? (
						<fbt desc="Shows when the last backup was downloaded">
							Last backup:{' '}
							<fbt:param name="date">
								{new Date(state.lastBackupAt).toLocaleDateString(locale)}
							</fbt:param>
						</fbt>
					) : (
						<fbt desc="Shown when no backup was downloaded yet">
							No backup downloaded on this device yet.
						</fbt>
					)}
				</p>
			</CardContent>
		</Card>
	);
}
