import { Locale as DateFnsLocale, setDefaultOptions } from 'date-fns';
import { IntlVariations, setupFbtee } from 'fbtee';
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';
import german from '../translations/de-DE.json';
import english from '../translations/en-US.json';

export const DEFAULT_LOCALE = 'en-US';

const allTranslations = {
	...german,
	...english,
};

export type Locale = keyof typeof allTranslations & string;

function isSupportedLocale(locale: string): locale is Locale {
	return Object.keys(allTranslations).includes(locale);
}

const localeToDateFnsLocale: Record<Locale, () => Promise<DateFnsLocale>> = {
	'de-DE': () => import('date-fns/locale/de').then(({ de }) => de),
	'en-US': () => import('date-fns/locale/en-US').then(({ enUS }) => enUS),
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
	hooks: { getViewerContext: () => viewerContext },
	translations: allTranslations,
});

export async function setLocale(locale: Locale): Promise<void> {
	if (!isSupportedLocale(locale)) {
		return;
	}

	setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, locale);
	viewerContext = { ...viewerContext, locale };

	const dateFnsLocale = localeToDateFnsLocale[locale];
	if (!dateFnsLocale) {
		return;
	}
	const localeModule = await dateFnsLocale();
	setDefaultOptions({ locale: localeModule });
}

export function getPreferredLocale(): Locale {
	let locale = getItem(STORAGE_KEYS.PREFERRED_LANGUAGE);

	if (!locale) {
		locale = navigator.language;
	}

	if (isSupportedLocale(locale)) {
		return locale;
	}

	return DEFAULT_LOCALE;
}
