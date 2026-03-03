import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary'],
			thresholds: {
				branches: 85,
				functions: 90,
				lines: 90,
				statements: 90,
			},
		},
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
	},
});
