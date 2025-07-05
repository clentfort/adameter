import '@testing-library/jest-dom/vitest';
import { IntlVariations, setupFbtee } from 'fbtee';
import { DEFAULT_LOCALE } from './i18n'; // Use the central DEFAULT_LOCALE

// Basic fbtee setup for tests
const viewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: DEFAULT_LOCALE, // Use 'en' or whatever is defined in i18n/index.ts
};

setupFbtee({
	hooks: { getViewerContext: () => viewerContext },
	translations: {}, // For tests, actual translations are usually mocked or not deeply tested
});
