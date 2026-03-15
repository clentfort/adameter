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

if (typeof window !== 'undefined') {
	window.requestIdleCallback =
		window.requestIdleCallback ||
		((cb) => {
			return setTimeout(() => {
				cb({
					didTimeout: false,
					timeRemaining: () => 50,
				});
			}, 1) as unknown as number;
		});

	window.cancelIdleCallback =
		window.cancelIdleCallback ||
		((id) => {
			clearTimeout(id);
		});
}
