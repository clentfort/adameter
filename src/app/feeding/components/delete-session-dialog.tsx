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
import type { FeedingSession } from '@/types/feeding';

interface DeleteSessionDialogProps {
	onClose: () => void;
	onDelete: (session: FeedingSession) => void;
	session: FeedingSession;
}

export default function DeleteSessionDialog({
	onClose,
	onDelete,
	session,
}: DeleteSessionDialogProps) {
	const handleDeleteConfirm = () => {
		onDelete(session);
		onClose();
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={true}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						<fbt desc="Title for a dialog asking the user to confirm deletion of a feeding session">
							Delete Entry
						</fbt>
					</AlertDialogTitle>
					<AlertDialogDescription>
						<fbt desc="Description for a dialog asking the user to confirm deletion of a feeding session">
							Do you really want to delete this entry? This action cannot be
							undone.
						</fbt>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						<fbt desc="Label on a button that cancels an action">Cancel</fbt>
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleDeleteConfirm}>
						<fbt desc="Label on a button that confirms the deletion of an item">
							Delete
						</fbt>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
