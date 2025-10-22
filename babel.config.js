import fbtCommon from './common_strings.json' with { type: 'json' };

export default {
	presets: [
		'next/babel',
		['@nkzw/babel-preset-fbtee', { fbtCommon }],
	],
};