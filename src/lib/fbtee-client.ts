import { createLocaleContext, IntlVariations } from 'fbtee';
import { DEFAULT_LOCALE, Locale, viewerContext } from '@/i18n';
// @ts-ignore Cannot find module './translations.json' or its corresponding type declarations.
import translations from '@/i18n/translations.json';

// Define the available languages in your app:
const availableLanguages = new Map([['en_US', 'English']]);

// Web:
const clientLocalesWeb =
	typeof navigator !== 'undefined'
		? [navigator.language, ...navigator.languages]
		: ['en_US'];

// A loader function to fetch translations for a given locale:
// For Storybook, we assume en_US uses source strings and doesn't require loading translations.
const loadLocale = async (locale: string) => {
	// If specific en_US translations were needed, they would be loaded here.
	if (locale === 'en_US') {
		// Example: return (await import('../src/i18n/translations.json')).default.en_US;
	}
	return {};
};

export const LocaleContext = createLocaleContext({
	availableLanguages,
	clientLocales: clientLocalesWeb,
	loadLocale,
});
