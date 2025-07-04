// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { FlatCompat } from '@eslint/eslintrc';
import nkzw from '@nkzw/eslint-config';
import { defineConfig } from 'eslint/config';

const compat = new FlatCompat({
	// import.meta.dirname is available after Node.js v20.11.0
	baseDirectory: import.meta.dirname,
});

const extended = compat.config({
	extends: [
		/* 'plugin:@nkzw/eslint-plugin-fbtee/recommended', */ 'next',
		'prettier',
	],
	plugins: ['@nkzw/eslint-plugin-fbtee'],
});

export default defineConfig(
	nkzw.map((rules) => {
		if (rules.plugins?.import != null) {
			delete rules.plugins.import;
		}
		if (rules.plugins?.['react-hooks'] != null) {
			delete rules.plugins['react-hooks'];
		}
		if (rules.rules?.['react-hooks/react-compiler']) {
			delete rules.rules['react-hooks/react-compiler'];
		}
		return rules;
	}),
	extended,
	{ ignores: ['.next/', 'src/components/ui'] },
);
