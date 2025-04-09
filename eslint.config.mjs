import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import nkzw from '@nkzw/eslint-config';

const compat = new FlatCompat({
	// import.meta.dirname is available after Node.js v20.11.0
	baseDirectory: import.meta.dirname,
});

const extended = compat.config({
	extends: ['next', 'prettier'],
});

export default defineConfig(
	nkzw.map((rules) => {
		if (rules.plugins?.import != null) {
			delete rules.plugins.import;
		}
		return rules;
	}),
	extended,
	{ ignores: ['.next/'] },
);
