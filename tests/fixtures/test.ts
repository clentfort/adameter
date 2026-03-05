import type { BrowserContext } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

export async function enableSkipProfile(context: BrowserContext) {
	await context.addInitScript(() => {
		window.localStorage.setItem('adameter-skip-profile', 'true');
	});
}

type Fixtures = {
	skipProfile: void;
};

export const test = base.extend<Fixtures>({
	skipProfile: [
		async ({ context }, use) => {
			await enableSkipProfile(context);
			await use();
		},
		{ auto: true },
	],
});

export { expect };
