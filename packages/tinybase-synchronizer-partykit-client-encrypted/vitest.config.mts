import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'tinybase-persister-partykit-client-encrypted': fileURLToPath(
				new URL(
					'../tinybase-persister-partykit-client-encrypted/src/index.ts',
					import.meta.url,
				),
			),
		},
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
	},
});
