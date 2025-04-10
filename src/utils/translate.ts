'use client';

import { useLanguage } from '@/contexts/language-context';
import {
	formatTimeAgo,
	getTranslation,
	type Locale,
	type TranslationKey,
} from '@/i18n';

export function useTranslate() {
	const { language } = useLanguage();

	const t = (key: TranslationKey, params?: Record<string, string | number>) => {
		return getTranslation(language as Locale, key, params);
	};

	// Add language and formatTimeAgo to the returned object
	return Object.assign(t, {
		formatTimeAgo: (value: number, unit: 'minute' | 'hour' | 'day') =>
			formatTimeAgo(language as Locale, value, unit),
		language,
	});
}
