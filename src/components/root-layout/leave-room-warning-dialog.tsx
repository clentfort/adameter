'use client';

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

interface LeaveRoomWarningDialogProps {
	onCancel: () => void;
	onConfirm: () => void;
}

export function LeaveRoomWarningDialog({
	onCancel,
	onConfirm,
}: LeaveRoomWarningDialogProps) {
	return (
		<AlertDialog open={true}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						<fbt desc="Title for leaving a room warning">
							Leave current room?
						</fbt>
					</AlertDialogTitle>
					<AlertDialogDescription>
						<fbt desc="Description for leaving a room warning">
							You are currently in a shared room. If you proceed, you will leave
							the current room to join another one.
						</fbt>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>
						<fbt common={true}>Cancel</fbt>
					</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						<fbt desc="Button to confirm leaving room">Leave Room</fbt>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
