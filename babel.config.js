import fbtCommon from './common_strings.json' with { type: 'json' };

const config = {
	plugins: [],
	presets: [['@nkzw/babel-preset-fbtee', { fbtCommon }], 'next/babel'],
};

export default config;
