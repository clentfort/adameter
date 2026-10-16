import { useLanguage } from '@/contexts/i18n-context';
import { STORE_VALUE_TIME_FORMAT } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export type TimeFormat = '12h' | '24h';

export function useTimeFormat() {
	const { locale } = useLanguage();
	const defaultTimeFormat: TimeFormat = locale === 'en-US' ? '12h' : '24h';

	return useStoreValueSetting<TimeFormat>(
		STORE_VALUE_TIME_FORMAT,
		defaultTimeFormat,
	);
}
