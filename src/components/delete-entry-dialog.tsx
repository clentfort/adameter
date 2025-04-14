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

interface DeleteEntryDialogProps {
	entry: string;
	onClose: () => void;
	onDelete: (id: string) => void;
}

export default function DeleteEntryDialog({
	entry,
	onClose,
	onDelete,
}: DeleteEntryDialogProps) {
	const handleDeleteConfirm = () => {
		onDelete(entry);
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
						<fbt common>Cancel</fbt>
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleDeleteConfirm}>
						<fbt common>Delete</fbt>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
