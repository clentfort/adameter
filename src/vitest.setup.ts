import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { IntlVariations, setupFbtee } from 'fbtee';
import { afterEach } from 'vitest';

afterEach(() => {
	cleanup();
});

const viewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: 'en_US',
};
setupFbtee({
	hooks: { getViewerContext: () => viewerContext },
	translations: {},
});
