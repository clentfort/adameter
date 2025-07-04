import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';
import fbtCommon from './common_strings.json' with { type: 'json' };

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		react({
			babel: {
				presets: [['@nkzw/babel-preset-fbtee', { fbtCommon }]],
			},
		}),
	],
	test: {
		coverage: {
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				'src/components/ui',
				'src/app/legal',
				'src/types',
			],
			provider: 'v8',
			reporter: ['text', 'json-summary', 'json'],
			reportsDirectory: './coverage',
		},
		environment: 'jsdom',
    root: './src',
		setupFiles: ['./src/vitest.setup.ts'],
		env: {
			TZ: 'UTC',
		},
	},
});
