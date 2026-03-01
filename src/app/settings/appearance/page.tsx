'use client';

import { fbt } from 'fbtee';
import { Coins, Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import { Locale } from '@/i18n';

export default function AppearanceSettingsPage() {
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const [currency, setCurrency] = useCurrency();

	const updateLocale = async (code: Locale) => {
		await setLocale(code);
	};

	return (
		<div className="space-y-4 w-full">
			<Card>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Globe className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for language setting">Language</fbt>
							</p>
						</div>
						<Select
							onValueChange={(v) => updateLocale(v as Locale)}
							value={locale}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="de_DE">🇩🇪 German</SelectItem>
								<SelectItem value="en_US">🇺🇸 English</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Moon className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for theme setting">Theme</fbt>
							</p>
						</div>
						<Select onValueChange={(v) => setTheme(v)} value={theme}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">
									<fbt desc="Light theme option">Light</fbt>
								</SelectItem>
								<SelectItem value="dark">
									<fbt desc="Dark theme option">Dark</fbt>
								</SelectItem>
								<SelectItem value="system">
									<fbt desc="System theme option">System</fbt>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Coins className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for currency setting">Currency</fbt>
							</p>
						</div>
						<Select
							onValueChange={(v) => setCurrency(v as Currency)}
							value={currency}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="GBP">£ GBP</SelectItem>
								<SelectItem value="EUR">€ EUR</SelectItem>
								<SelectItem value="USD">$ USD</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
