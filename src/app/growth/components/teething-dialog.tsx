import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import TeethingProgress from './teething-progress';

interface TeethingDialogProps {
	onClose: () => void;
}

export default function TeethingDialog({ onClose }: TeethingDialogProps) {
	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="teethingTitle">Teething Progress</fbt>
					</DialogTitle>
				</DialogHeader>
				<TeethingProgress />
			</DialogContent>
		</Dialog>
	);
}
