import { de } from './locales/de';
import { en } from './locales/en';

// Define available locales
export const locales = {
	de,
	en,
};

// Define locale type
export type Locale = keyof typeof locales;

// Define translation key type
export type TranslationKey = keyof typeof de;

// Helper function to get translation
export function getTranslation(
	locale: Locale,
	key: TranslationKey,
	params?: Record<string, string | number>,
): string {
	let text = locales[locale][key] || key;

	if (params) {
		Object.entries(params).forEach(([param, value]) => {
			text = text.replace(`{${param}}`, String(value));
		});
	}

	return text;
}

// Format time expressions according to locale
export function formatTimeAgo(
	locale: Locale,
	value: number,
	unit: 'minute' | 'hour' | 'day',
): string {
	const unitKey = value === 1 ? unit : (`${unit}s` as TranslationKey);

	return locale === 'de' ? `vor ${value} ${locales[locale][unitKey]}` : `${value} ${locales[locale][unitKey]} ${locales[locale]['ago']}`;
}
