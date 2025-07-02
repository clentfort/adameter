import { Locale as DateFnsLocale, setDefaultOptions } from 'date-fns';
import { IntlVariations, setupFbtee } from 'fbtee';
// @ts-expect-error Cannot find module './translations.json' or its corresponding type declarations.
import translations from './translations.json';

export const DEFAULT_LOCALE = 'en_US';
export type Locale = typeof DEFAULT_LOCALE | keyof typeof translations;
const LOCAL_STORAGE_KEY = 'preferredLanguage';

function isSupportedLocale(locale: string): locale is Locale {
	return (
		locale === DEFAULT_LOCALE || Object.keys(translations).includes(locale)
	);
}

const localeToDateFnsLocale: Record<Locale, () => Promise<DateFnsLocale>> = {
	de_DE: () => import('date-fns/locale/de').then(({ de }) => de),
	en_US: () => import('date-fns/locale/en-US').then(({ enUS }) => enUS),
};

interface ViewerContext {
	GENDER: IntlVariations;
	locale: Locale;
}

let viewerContext: ViewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: DEFAULT_LOCALE,
};

setupFbtee({
	// @ts-expect-error Call signature return types 'ViewerContext' and '{ GENDER: IntlVariations; locale: string; }' are incompatible.
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
	// @ts-expect-error Argument of type 'Locale' is not assignable to parameter of type 'string'.
	localStorage.setItem(LOCAL_STORAGE_KEY, locale);
	viewerContext = { ...viewerContext, locale };

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
	let locale = localStorage.getItem(LOCAL_STORAGE_KEY);

	if (!locale) {
		const browserLang = navigator.language;
		locale = browserLang.replace('-', '_');
	}

	if (isSupportedLocale(locale)) {
		return locale;
	}

	return DEFAULT_LOCALE;
}
