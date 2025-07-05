import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';
// Assuming common_strings.json is still at the root for fbtee:collect
import fbtCommon from './common_strings.json' with { type: 'json' };

export default defineConfig({
	plugins: [
		tsconfigPaths(), // To resolve paths like @/*
		react({
			babel: { // For processing fbt syntax in tests
				presets: [['@nkzw/babel-preset-fbtee', { fbtCommon }]],
			},
		}),
	],
	test: {
		globals: true, // Enables global test APIs like describe, it, expect
		environment: 'jsdom', // Simulates a browser environment
		root: './', // Set root to project directory for easier path resolution
		setupFiles: ['./src/vitest.setup.ts'], // Path relative to the new root
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary', 'json'],
			reportsDirectory: './coverage',
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				'.next/',
				'out/',
				'public/', // Typically not included in coverage
				'.storybook/',
				'storybook-static/',
				'coverage/',
				'*.config.{js,ts,mjs,mts}', // Config files
				'src/vitest.setup.ts',
				'src/i18n/', // i18n setup files, usually tested via components
				// Add other specific files/dirs to exclude if necessary
			],
		},
		env: {
			TZ: 'UTC', // Consistent timezone for tests
		},
	},
});
