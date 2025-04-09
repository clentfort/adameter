'use client';

import { useLanguage } from '@/contexts/language-context';
import { useTranslate } from '@/utils/translate';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSwitcher() {
	const { language, setLanguage } = useLanguage();
	const t = useTranslate();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="icon"
					title={t('language')}
					type="button"
					variant="outline"
				>
					<Globe className="h-4 w-4" />
					<span className="sr-only">{t('language')}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					className={language === 'de' ? 'bg-accent' : ''}
					onClick={() => setLanguage('de')}
				>
					🇩🇪 {t('german')}
				</DropdownMenuItem>
				<DropdownMenuItem
					className={language === 'en' ? 'bg-accent' : ''}
					onClick={() => setLanguage('en')}
				>
					🇬🇧 {t('english')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
