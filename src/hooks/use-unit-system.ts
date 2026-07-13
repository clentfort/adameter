import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { useLanguage } from '@/contexts/i18n-context';
import { STORE_VALUE_UNIT_SYSTEM } from '@/lib/tinybase-sync/constants';

export type UnitSystem = 'imperial' | 'metric';

export function useUnitSystem() {
	const { locale } = useLanguage();
	const unitSystem = useValue(STORE_VALUE_UNIT_SYSTEM) as
		UnitSystem | undefined;

	const setUnitSystem = useSetValueCallback(
		STORE_VALUE_UNIT_SYSTEM,
		(newUnitSystem: UnitSystem) => newUnitSystem,
		[],
	);

	const defaultUnitSystem: UnitSystem =
		locale === 'en-US' ? 'imperial' : 'metric';

	return [unitSystem ?? defaultUnitSystem, setUnitSystem] as const;
}
