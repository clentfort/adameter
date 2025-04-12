'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fbt } from 'fbtee';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
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
				<DropdownMenuItem className={false ? 'bg-accent' : ''}>
					🇩🇪 <fbt desc="Label to switch to the German locale">German</fbt>
				</DropdownMenuItem>
				<DropdownMenuItem className={true ? 'bg-accent' : ''}>
					🇬🇧 <fbt desc="Label to switch to the English locale">English</fbt>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
