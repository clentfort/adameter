'use client';

import { fbt } from 'fbtee';
import { Coins, Globe, LayoutGrid, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';
import { Locale } from '@/i18n';
import { SettingsHeader } from '../components/settings-header';

export default function AppearanceSettingsPage() {
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const [currency, setCurrency] = useCurrency();
	const [devMode, setDevMode] = useDevMode();
	const [showComparisonCharts, setShowComparisonCharts] =
		useShowComparisonCharts();

	const updateLocale = async (code: Locale) => {
		await setLocale(code);
	};

	return (
		<>
			<SettingsHeader
				title={fbt('Appearance', 'Title for appearance settings section')}
			/>

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
								onValueChange={(v) => {
									if (v) {
										void updateLocale(v as Locale);
									}
								}}
								value={locale}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="de_DE">German</SelectItem>
									<SelectItem value="en_US">English</SelectItem>
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
							<Select
								onValueChange={(v) => {
									if (v) {
										setTheme(v);
									}
								}}
								value={theme}
							>
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
								onValueChange={(v) => {
									if (v) {
										setCurrency(v as Currency);
									}
								}}
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

						<div className="space-y-4 border-t pt-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<div className="flex items-center gap-2">
										<LayoutGrid className="h-4 w-4" />
										<Label className="text-sm font-medium" htmlFor="butterfly">
											<fbt desc="Label for butterfly charts setting">
												Butterfly Charts
											</fbt>
										</Label>
									</div>
									<p className="text-xs text-muted-foreground">
										<fbt desc="Description for butterfly charts setting">
											Show comparison data in statistics
										</fbt>
									</p>
								</div>
								<Switch
									checked={showComparisonCharts}
									id="butterfly"
									onCheckedChange={setShowComparisonCharts}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-sm font-medium" htmlFor="dev-mode">
										<fbt desc="Label for dev mode setting">Dev Mode</fbt>
									</Label>
									<p className="text-xs text-muted-foreground">
										<fbt desc="Description for dev mode setting">
											Enable developer tools and error details
										</fbt>
									</p>
								</div>
								<Switch
									checked={devMode}
									id="dev-mode"
									onCheckedChange={setDevMode}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
