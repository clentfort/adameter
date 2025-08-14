import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
	addons: ['@storybook/addon-docs'],
	babel: async (options) => {
		options.presets.forEach((preset, i) => {
			if (Array.isArray(preset)) {
				if (typeof preset[0] === 'string' && preset[0].includes('next/babel')) {
					preset[1] = preset[1] || {};
					preset[1]['preset-react'] = {
						...(preset[1]['preset-react'] || {}),
						throwIfNamespace: false,
					};
				}
			} else if (typeof preset === 'string' && preset.includes('next/babel')) {
				options.presets[i] = [
					preset,
					{
						'preset-react': {
							throwIfNamespace: false,
						},
					},
				];
			}
		});
		return options;
	},
	framework: {
		name: '@storybook/nextjs',
		options: {},
	},
	staticDirs: ['../public'],
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
};
export default config;
