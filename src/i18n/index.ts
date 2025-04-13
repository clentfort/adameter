import { Locale as DateFnsLocale, setDefaultOptions } from 'date-fns';
import { IntlVariations, setupFbtee } from 'fbtee';
import translations from './translations.json' with { type: 'json' };

export type Locale = 'en_US' | keyof typeof translations;
const DEFAULT_LOCALE = 'en_US';

function isSupportedLocale(locale: string): locale is Locale {
	return locale === 'en_US' || Object.keys(translations).includes(locale);
}

const localeToDateFnsLocale: Record<
	Locale,
	() => undefined | Promise<DateFnsLocale>
> = {
	de_DE: () => import('date-fns/locale/de').then(({ de }) => de),
	en_US: () => undefined,
};

const LOCAL_STORAGE_KEY = 'preferredLanguage';

interface ViewerContext {
	GENDER: IntlVariations;
	locale: Locale;
}

const viewerContext: ViewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: 'en_US',
};

setupFbtee({
	hooks: { getViewerContext: () => viewerContext },
	translations,
});

export async function setLocale(locale: Locale): Promise<void> {
	if (typeof window === 'undefined') {
		return;
	}

	if (!isSupportedLocale(locale)) {
		return;
	}

	// @TODO(localStorage): Move all local storage access to dedicated module
	localStorage.setItem(LOCAL_STORAGE_KEY, locale);
	viewerContext.locale = locale;

	const dateFnsLocale = localeToDateFnsLocale[locale];
	if (!dateFnsLocale) {
		return;
	}
	const localeModule = await dateFnsLocale();
	setDefaultOptions({ locale: localeModule });
}

export function getPreferredLocale(): Locale {
	if (typeof window === 'undefined') {
		return DEFAULT_LOCALE;
	}

	// @TODO(localStorage): Move all local storage access to dedicated module
	const storedLocale = localStorage.getItem(LOCAL_STORAGE_KEY) as Locale | null;

	if (storedLocale) {
		return storedLocale;
	}

	const browserLang = navigator.language;
	const locale = browserLang.replace('-', '_');

	if (isSupportedLocale(locale)) {
		return locale;
	}

	return DEFAULT_LOCALE;
}
