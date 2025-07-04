import type { Preview } from '@storybook/nextjs';
import { createLocaleContext } from 'fbtee';
import React from 'react';
import '../src/app/globals.css';

// Define the available languages in your app for Storybook:
const availableLanguages = new Map([['en_US', 'English']]);

// Web:
const clientLocalesWeb =
	typeof navigator !== 'undefined'
		? [navigator.language, ...navigator.languages]
		: ['en_US'];

// A loader function to fetch translations for a given locale:
// For Storybook, we assume en_US uses source strings and doesn't require loading translations.
const loadLocale = async (locale: string) => {
	// If specific en_US translations were needed, they would be loaded here.
	if (locale === 'en_US') {
		// Example: return (await import('../src/i18n/translations.json')).default.en_US;
	}
	return {};
};

const LocaleContext = createLocaleContext({
	availableLanguages,
	clientLocales: clientLocalesWeb,
	loadLocale,
});

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /date$/i,
			},
		},
	},
	decorators: [
		(Story) => (
			<LocaleContext>
				<Story />
			</LocaleContext>
		),
	],
};

export default preview;
