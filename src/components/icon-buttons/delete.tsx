import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface DeleteIconButtonProps {
	onClick: () => void;
}

export default function DeleteIconButton({ onClick }: DeleteIconButtonProps) {
	return (
		<Button
			className="h-7 w-7 text-destructive"
			onClick={onClick}
			size="icon"
			variant="ghost"
		>
			<Trash2 className="h-4 w-4" />
			<span className="sr-only">
				<fbt desc="Screen reader text for delete button">Delete</fbt>
			</span>
		</Button>
	);
}
