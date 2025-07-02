import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-onboarding',
		'@storybook/addon-essentials', // Added for broader compatibility
		'@storybook/addon-interactions', // Added for interaction testing
		// '@storybook/addon-postcss', // PostCSS is typically handled by Next.js integration
		'@storybook/addon-vitest',
	],
	framework: {
		name: '@storybook/nextjs',
		options: {},
	},
	staticDirs: ['../public'],
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	babel: async (options) => {
		// The @storybook/nextjs framework should pick up the project's babel.config.js automatically.
		return options;
	},
};
export default config;
