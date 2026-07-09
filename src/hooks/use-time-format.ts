import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { useLanguage } from '@/contexts/i18n-context';
import { STORE_VALUE_TIME_FORMAT } from '@/lib/tinybase-sync/constants';

export type TimeFormat = '12h' | '24h';

export function useTimeFormat() {
	const { locale } = useLanguage();
	const timeFormat = useValue(STORE_VALUE_TIME_FORMAT) as
		TimeFormat | undefined;

	const setTimeFormat = useSetValueCallback(
		STORE_VALUE_TIME_FORMAT,
		(newTimeFormat: TimeFormat) => newTimeFormat,
		[],
	);

	const defaultTimeFormat: TimeFormat = locale === 'en-US' ? '12h' : '24h';

	return [timeFormat ?? defaultTimeFormat, setTimeFormat] as const;
}
