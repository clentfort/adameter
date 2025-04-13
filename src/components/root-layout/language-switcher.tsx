'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/i18n-context';
import { Locale } from '@/i18n';
import { fbt } from 'fbtee';
import { Globe } from 'lucide-react';

interface LocaleMenuItem {
	code: Locale;
	flag: string;
	label: string;
}

const locales: Array<LocaleMenuItem> = [
	{
		code: 'de_DE',
		flag: '🇩🇪',
		label: fbt('German', 'Label to switch to the German locale'),
	},
	{
		code: 'en_US',
		flag: '🇬🇧',
		label: fbt('English', 'Label to switch to the English locale'),
	},
];

export default function LanguageSwitcher() {
	const { locale, setLocale } = useLanguage(); // Get the current language and the setter

	// Function to switch the language
	const switchLocale = (newLocale: Locale) => {
		setLocale(newLocale); // Set the new language in the context
	};

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
				{locales.map(({ code, flag, label }) => (
					<DropdownMenuItem
						className={code === locale ? 'bg-accent font-medium' : ''}
						key={code}
						onSelect={() => switchLocale(code)}
					>
						<span className="mr-2">{flag}</span> {label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
