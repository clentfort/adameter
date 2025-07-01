import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-onboarding',
		// '@storybook/addon-postcss', // Removed as Vite handles PostCSS
		'@storybook/addon-vitest',
	],
	framework: {
		name: '@storybook/nextjs-vite',
		options: {},
	},
	staticDirs: ['../public'],
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
};
export default config;
