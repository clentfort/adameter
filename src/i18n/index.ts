import { IntlVariations, setupFbtee } from 'fbtee';
import translations from './translations.json' with { type: 'json' };

const viewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: 'de_DE',
};
setupFbtee({
	hooks: {
		getViewerContext: () => viewerContext,
	},
	translations,
});
