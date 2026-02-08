import nkzw from '@nkzw/eslint-config';
import fbtee from '@nkzw/eslint-plugin-fbtee';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	...nkzw,
	prettier,
	fbtee.configs.recommended,
	{
		plugins: {
			'@nkzw/fbtee': fbtee,
		},
	},
	{
		rules: {
			'react-hooks/immutability': 'off',
			'react-hooks/incompatible-library': 'off',
			'react-hooks/purity': 'off',
			'react-hooks/react-compiler': 'off',
			'react-hooks/refs': 'off',
			'react-hooks/set-state-in-effect': 'off',
		},
	},
	{
		files: ['src/i18n/index.ts'],
		rules: {
			'import-x/no-unresolved': 'off',
			'import/no-unresolved': 'off',
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
		'src/components/ui',
		'storybook-static/**',
	]),
]);

export default eslintConfig;
