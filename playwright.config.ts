import { defineConfig, devices } from '@playwright/test';
import { PRODUCTION_BASE_URL, PRODUCTION_PORT } from './tests/helpers/servers';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI
		? [
				['list'],
				['github'],
				['html', { open: 'never' }],
				['json', { outputFile: 'playwright-report/results.json' }],
			]
		: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: 'http://localhost:3000',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: [
		{
			command: 'pnpm run dev',
			reuseExistingServer: !process.env.CI,
			stderr: 'pipe',
			stdout: 'pipe',
			url: 'http://localhost:3000',
		},
		{
			// The service worker is registered in production builds only. Wait for
			// the dev server, whose `predev` step generates the translations.
			command: `until curl -s -o /dev/null http://localhost:3000; do sleep 1; done && pnpm exec next build && pnpm exec next start --port ${PRODUCTION_PORT}`,
			env: {
				NEXT_DIST_DIR: '.next-e2e',
				NEXT_PUBLIC_PARTYKIT_HOST: 'localhost:1999',
			},
			reuseExistingServer: !process.env.CI,
			stderr: 'pipe',
			stdout: 'pipe',
			timeout: 300_000,
			url: PRODUCTION_BASE_URL,
		},
	],
});
