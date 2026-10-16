import { useLanguage } from '@/contexts/i18n-context';
import { STORE_VALUE_UNIT_SYSTEM } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export type UnitSystem = 'imperial' | 'metric';

export function useUnitSystem() {
	const { locale } = useLanguage();
	const defaultUnitSystem: UnitSystem =
		locale === 'en-US' ? 'imperial' : 'metric';

	return useStoreValueSetting<UnitSystem>(
		STORE_VALUE_UNIT_SYSTEM,
		defaultUnitSystem,
	);
}
