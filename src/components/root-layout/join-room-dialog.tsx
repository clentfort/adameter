'use client';

import { fbt } from 'fbtee';
import { useContext } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';

interface JoinRoomDialogProps {
	onCancel: () => void;
	onJoin?: () => void;
	roomId: string;
}

export function JoinRoomDialog({
	onCancel,
	onJoin,
	roomId,
}: JoinRoomDialogProps) {
	const { joinRoom } = useContext(DataSynchronizationContext);

	const handleJoin = (strategy: 'clear' | 'merge') => {
		joinRoom(roomId, strategy);
		onJoin?.();
	};

	return (
		<AlertDialog open={true}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						<fbt desc="Title for joining a room">Join Room</fbt>
					</AlertDialogTitle>
					<AlertDialogDescription>
						<fbt desc="Description for joining a room">
							You are about to join room <fbt:param name="roomId">{roomId}</fbt:param>.
							Would you like to merge your existing data into this room, or
							clear it before joining?
						</fbt>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex-col gap-2 sm:flex-row">
					<AlertDialogCancel onClick={onCancel}>
						<fbt common={true}>Cancel</fbt>
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={() => handleJoin('clear')}
					>
						<fbt desc="Button to clear data and join room">Clear & Join</fbt>
					</AlertDialogAction>
					<AlertDialogAction onClick={() => handleJoin('merge')}>
						<fbt desc="Button to merge data and join room">Merge & Join</fbt>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
