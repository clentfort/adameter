import translations from '@/translations.json';
import { IntlVariations, setupFbtee } from 'fbtee';

setupFbtee({
	hooks: {
		getViewerContext: () => ({
			GENDER: IntlVariations.GENDER_UNKNOWN,
			locale: 'en_US',
		}),
	},
	translations,
});
