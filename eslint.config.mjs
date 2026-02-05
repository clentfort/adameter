// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { FlatCompat } from '@eslint/eslintrc';
import nkzw from '@nkzw/eslint-config';
import nextConfig from 'eslint-config-next';
import { defineConfig } from 'eslint/config';

const compat = new FlatCompat({
	// import.meta.dirname is available after Node.js v20.11.0
	baseDirectory: import.meta.dirname,
});

const prettierConfig = compat.extends('prettier');

export default defineConfig([
	...nkzw.map((rules) => {
		if (rules.plugins?.['react-hooks'] != null) {
			delete rules.plugins['react-hooks'];
		}
		if (rules.rules?.['react-hooks/react-compiler']) {
			delete rules.rules['react-hooks/react-compiler'];
		}
		return rules;
	}),
	...nextConfig,
	...prettierConfig,
	{ ignores: ['.next/', 'src/components/ui'] },
]);
