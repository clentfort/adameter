import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';

interface EditIconButtonProps {
	onClick: () => void;
}

export default function EditIconButton({ onClick }: EditIconButtonProps) {
	return (
		<Button className="h-7 w-7" onClick={onClick} size="icon" variant="ghost">
			<Pencil className="h-4 w-4" />
			<span className="sr-only">
				<fbt common>Edit</fbt>
			</span>
		</Button>
	);
}
