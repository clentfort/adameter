import { CloudAlert, CloudCheck, CloudOff, RefreshCw } from 'lucide-react';
import { useRoomSyncStatus } from '@/contexts/room-sync-status-context';

export function RoomSyncStatus() {
	const status = useRoomSyncStatus();
	if (!status) return null;

	if (status === 'error') {
		return (
			<p
				className="flex items-center gap-2 text-sm text-destructive"
				data-testid="room-sync-status"
				role="status"
			>
				<CloudAlert className="h-4 w-4 shrink-0" />
				<fbt desc="Status shown when some changes are rejected by the shared room, e.g. because the device clock is wrong">
					Some changes could not be synced and are only saved on this device.
					Check this device&apos;s date and time.
				</fbt>
			</p>
		);
	}

	if (status === 'offline') {
		return (
			<p
				className="flex items-center gap-2 text-sm text-muted-foreground"
				data-testid="room-sync-status"
				role="status"
			>
				<CloudOff className="h-4 w-4 shrink-0" />
				<fbt desc="Status shown when the shared room cannot be reached">
					Offline. Changes are saved on this device and sync once the connection
					is back.
				</fbt>
			</p>
		);
	}

	return (
		<p
			className="flex items-center gap-2 text-sm text-muted-foreground"
			data-testid="room-sync-status"
			role="status"
		>
			{status === 'syncing' ? (
				<>
					<RefreshCw className="h-4 w-4 shrink-0" />
					<fbt desc="Status shown while changes are synced with the shared room">
						Syncing…
					</fbt>
				</>
			) : (
				<>
					<CloudCheck className="h-4 w-4 shrink-0" />
					<fbt desc="Status shown when all changes are synced with the shared room">
						All changes synced
					</fbt>
				</>
			)}
		</p>
	);
}
