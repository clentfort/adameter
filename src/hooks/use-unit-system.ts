import { useLanguage } from '@/contexts/i18n-context';

export type UnitSystem = 'metric' | 'imperial';

export const useUnitSystem = (): UnitSystem => {
	const { locale } = useLanguage();
	return locale === 'en_US' ? 'imperial' : 'metric';
};
