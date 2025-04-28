import { fbt } from 'fbtee';
import { Globe } from 'lucide-react';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';

export default function DataSharingSwitcher() {
	const setRoom = useContext(DataSynchronizationContext);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="icon"
					title={fbt('Language', 'Label for the language switcher')}
					type="button"
					variant="outline"
				>
					<Globe className="h-4 w-4" />
					<span className="sr-only">
						<fbt desc="Label for the language switcher">Language</fbt>
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onSelect={() => setRoom('feeding')}>
					On
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
