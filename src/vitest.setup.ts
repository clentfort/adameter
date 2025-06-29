import '@testing-library/jest-dom/vitest';
import { IntlVariations, setupFbtee } from 'fbtee';

const viewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: 'en_US',
};
setupFbtee({
	hooks: { getViewerContext: () => viewerContext },
	translations: {},
});
