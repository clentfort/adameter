'use client';

import { fbt } from 'fbtee';
import {
	Clock,
	Coins,
	Globe,
	LayoutGrid,
	MapPin,
	Moon,
	Ruler,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useLocationTracking } from '@/hooks/use-location-tracking';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';
import { useShowFeeding } from '@/hooks/use-show-feeding';
import { useTimeFormat } from '@/hooks/use-time-format';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { Locale } from '@/i18n';
import { SettingsHeader } from '../components/settings-header';
import { SettingsSelectField } from '../components/settings-select-field';
import { SettingsSwitchRow } from '../components/settings-switch-row';

export default function AppearanceSettingsPage() {
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const [unitSystem, setUnitSystem] = useUnitSystem();
	const [timeFormat, setTimeFormat] = useTimeFormat();
	const [currency, setCurrency] = useCurrency();
	const [devMode, setDevMode] = useDevMode();
	const [showComparisonCharts, setShowComparisonCharts] =
		useShowComparisonCharts();
	const [showFeeding, setShowFeeding] = useShowFeeding();
	const [locationTracking, setLocationTracking] = useLocationTracking();

	return (
		<>
			<SettingsHeader
				title={fbt('Appearance', 'Title for appearance settings section')}
			/>

			<div className="space-y-4 w-full">
				<Card>
					<CardContent className="space-y-6">
						<SettingsSelectField<Locale>
							icon={<Globe className="h-4 w-4" />}
							label={<fbt desc="Label for language setting">Language</fbt>}
							onChange={setLocale}
							options={[
								{ label: 'German', value: 'de-DE' },
								{ label: 'English', value: 'en-US' },
							]}
							value={locale}
						/>

						<SettingsSelectField<'12h' | '24h'>
							icon={<Clock className="h-4 w-4" />}
							label={
								<fbt desc="Label for time format setting">Time Format</fbt>
							}
							onChange={setTimeFormat}
							options={[
								{
									label: <fbt desc="12-hour time format option">12-hour</fbt>,
									value: '12h',
								},
								{
									label: <fbt desc="24-hour time format option">24-hour</fbt>,
									value: '24h',
								},
							]}
							value={timeFormat}
						/>

						<SettingsSelectField<'metric' | 'imperial'>
							icon={<Ruler className="h-4 w-4" />}
							label={
								<fbt desc="Label for unit system setting">Unit System</fbt>
							}
							onChange={setUnitSystem}
							options={[
								{
									label: <fbt desc="Metric unit system option">Metric</fbt>,
									value: 'metric',
								},
								{
									label: <fbt desc="Imperial unit system option">Imperial</fbt>,
									value: 'imperial',
								},
							]}
							value={unitSystem}
						/>

						<SettingsSelectField<string>
							icon={<Moon className="h-4 w-4" />}
							label={<fbt desc="Label for theme setting">Theme</fbt>}
							onChange={setTheme}
							options={[
								{
									label: <fbt desc="Light theme option">Light</fbt>,
									value: 'light',
								},
								{
									label: <fbt desc="Dark theme option">Dark</fbt>,
									value: 'dark',
								},
								{
									label: <fbt desc="System theme option">System</fbt>,
									value: 'system',
								},
							]}
							value={theme ?? ''}
						/>

						<SettingsSelectField<Currency>
							icon={<Coins className="h-4 w-4" />}
							label={<fbt desc="Label for currency setting">Currency</fbt>}
							onChange={setCurrency}
							options={[
								{ label: '£ GBP', value: 'GBP' },
								{ label: '€ EUR', value: 'EUR' },
								{ label: '$ USD', value: 'USD' },
							]}
							value={currency}
						/>

						<div className="space-y-4 border-t pt-4">
							<SettingsSwitchRow
								checked={showComparisonCharts}
								description={
									<fbt desc="Description for butterfly charts setting">
										Show comparison data in statistics
									</fbt>
								}
								icon={<LayoutGrid className="h-4 w-4" />}
								id="butterfly"
								label={
									<fbt desc="Label for butterfly charts setting">
										Butterfly Charts
									</fbt>
								}
								onCheckedChange={setShowComparisonCharts}
							/>

							<SettingsSwitchRow
								checked={showFeeding ?? true}
								description={
									<fbt desc="Description for show feeding setting">
										Show breastfeeding and feeding tracking features
									</fbt>
								}
								id="show-feeding"
								label={
									<fbt desc="Label for show feeding setting">Show Feeding</fbt>
								}
								onCheckedChange={setShowFeeding}
							/>

							<SettingsSwitchRow
								checked={locationTracking}
								description={
									<fbt desc="Description for location tracking setting">
										Automatically capture location for recent diaper and feeding
										events
									</fbt>
								}
								icon={<MapPin className="h-4 w-4" />}
								id="location-tracking"
								label={
									<fbt desc="Label for location tracking setting">
										Location Tracking
									</fbt>
								}
								onCheckedChange={setLocationTracking}
							/>

							<SettingsSwitchRow
								checked={devMode}
								description={
									<fbt desc="Description for dev mode setting">
										Enable developer tools and error details
									</fbt>
								}
								id="dev-mode"
								label={<fbt desc="Label for dev mode setting">Dev Mode</fbt>}
								onCheckedChange={setDevMode}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
