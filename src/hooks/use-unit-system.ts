import { useLanguage } from '@/contexts/i18n-context';

export type UnitSystem = 'imperial' | 'metric';

export function useUnitSystem(): UnitSystem {
	const { locale } = useLanguage();
	return locale === 'en_US' ? 'imperial' : 'metric';
}
