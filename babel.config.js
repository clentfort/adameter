import fbtCommon from './common_strings.json' with { type: 'json' };

const config = {
	presets: ['next/babel', ['@nkzw/babel-preset-fbtee', { fbtCommon }]],
};

export default config;
