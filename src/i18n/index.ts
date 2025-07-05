import { Locale as DateFnsLocale, setDefaultOptions } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { de } from 'date-fns/locale/de';
import { IntlVariations, setupFbtee } from 'fbtee';

// Using simple 'en' and 'de' to align with page.tsx and typical language selectors
export const DEFAULT_LOCALE = 'en';
export const ALL_LOCALES = ['en', 'de'] as const; // Make it a const array for stricter typing
export type Locale = (typeof ALL_LOCALES)[number];

const LOCAL_STORAGE_KEY = 'preferredLanguage';

function isSupportedLocale(locale: string): locale is Locale {
	return ALL_LOCALES.includes(locale as Locale);
}

const localeToDateFnsLocaleModule: Record<Locale, DateFnsLocale> = {
	de: de,
	en: enUS,
};

interface ViewerContext {
	GENDER: IntlVariations; // Retaining GENDER for fbtee, though not actively used in this minimal example
	locale: Locale;
}

let viewerContext: ViewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: DEFAULT_LOCALE,
};

// Minimal translations, assuming fbtee:translate will populate these later via .fbtee/translated-esm/
// For now, fbtee will use the source strings if translations are missing.
setupFbtee({
	hooks: { getViewerContext: () => viewerContext },
	translations: {
		// de_DE: {} // This structure might change based on fbtee:translate output
	},
});

export async function setLocale(locale: Locale): Promise<void> {
	if (typeof window === 'undefined') {
		return;
	}

	if (!isSupportedLocale(locale)) {
		console.warn(`Unsupported locale: ${locale}`);
		return;
	}

	localStorage.setItem(LOCAL_STORAGE_KEY, locale);
	viewerContext = { ...viewerContext, locale };

	const dateFnsLocaleModule = localeToDateFnsLocaleModule[locale];
	if (dateFnsLocaleModule) {
		setDefaultOptions({ locale: dateFnsLocaleModule });
	}
	// No dynamic import needed if we import locales directly
}

export function getPreferredLocale(): Locale {
	if (typeof window === 'undefined') {
		return DEFAULT_LOCALE;
	}

	let locale = localStorage.getItem(LOCAL_STORAGE_KEY);

	if (!locale) {
		const browserLang = navigator.language.split('-')[0]; // Get 'en' from 'en-US'
		locale = browserLang;
	}

	if (isSupportedLocale(locale)) {
		return locale;
	}

	return DEFAULT_LOCALE;
}

// Initialize locale on load
if (typeof window !== 'undefined') {
	setLocale(getPreferredLocale());
}
