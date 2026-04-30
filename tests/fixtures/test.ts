import type { BrowserContext, Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

/* eslint-disable unicorn/consistent-function-scoping */

export async function setTinyBaseValue(
	pageOrContext: BrowserContext | Page,
	valueId: string,
	value: unknown,
) {
	const isPage = 'url' in pageOrContext;
	const isContext = !isPage && 'addInitScript' in pageOrContext;

	const script = ({
		value: value_,
		valueId: valueId_,
	}: {
		value: unknown;
		valueId: string;
	}) => {
		const checkStore = () => {
			const store = (
				window as unknown as {
					tinybaseStore: { setValue: (id: string, val: unknown) => void };
				}
			).tinybaseStore;
			if (store) {
				store.setValue(
					valueId_,
					typeof value_ === 'object' ? JSON.stringify(value_) : value_,
				);
				return true;
			}
			return false;
		};
		if (!checkStore()) {
			const interval = setInterval(() => {
				if (checkStore()) clearInterval(interval);
			}, 50);
		}
	};

	if (isContext) {
		await (pageOrContext as BrowserContext).addInitScript(script, {
			value,
			valueId,
		});
	} else {
		const page = pageOrContext as Page;
		await page.addInitScript(script, { value, valueId });
		if (page.url() !== 'about:blank') {
			await page.evaluate(
				({ value: value_, valueId: valueId_ }) => {
					return new Promise<void>((resolve) => {
						const checkStore = () => {
							const store = (
								window as unknown as {
									tinybaseStore: {
										setValue: (id: string, val: unknown) => void;
									};
								}
							).tinybaseStore;
							if (store) {
								store.setValue(
									valueId_,
									typeof value_ === 'object' ? JSON.stringify(value_) : value_,
								);
								resolve();
							} else {
								setTimeout(checkStore, 50);
							}
						};
						checkStore();
					});
				},
				{ value, valueId },
			);
		}
	}
}

export async function setTinyBaseRow(
	pageOrContext: BrowserContext | Page,
	tableId: string,
	rowId: string,
	row: unknown,
) {
	const isPage = 'url' in pageOrContext;
	const isContext = !isPage && 'addInitScript' in pageOrContext;

	const script = ({
		row: row_,
		rowId: rowId_,
		tableId: tableId_,
	}: {
		row: unknown;
		rowId: string;
		tableId: string;
	}) => {
		const checkStore = () => {
			const store = (
				window as unknown as {
					tinybaseStore: {
						getValue: (id: string) => unknown;
						setRow: (tId: string, rId: string, r: unknown) => void;
					};
				}
			).tinybaseStore;
			if (store) {
				const selectedProfileId = store.getValue('selectedProfileId');
				const finalRow =
					typeof row_ === 'object' &&
					row_ !== null &&
					tableId_ !== 'profiles' &&
					selectedProfileId
						? { ...row_, profileId: selectedProfileId }
						: row_;
				store.setRow(tableId_, rowId_, finalRow);
				return true;
			}
			return false;
		};
		if (!checkStore()) {
			const interval = setInterval(() => {
				if (checkStore()) clearInterval(interval);
			}, 50);
		}
	};

	if (isContext) {
		await (pageOrContext as BrowserContext).addInitScript(script, {
			row,
			rowId,
			tableId,
		});
	} else {
		const page = pageOrContext as Page;
		await page.addInitScript(script, { row, rowId, tableId });
		if (page.url() !== 'about:blank') {
			await page.evaluate(
				({ row: row_, rowId: rowId_, tableId: tableId_ }) => {
					return new Promise<void>((resolve) => {
						const checkStore = () => {
							const store = (
								window as unknown as {
									tinybaseStore: {
										getValue: (id: string) => unknown;
										setRow: (tId: string, rId: string, r: unknown) => void;
									};
								}
							).tinybaseStore;
							if (store) {
								const selectedProfileId = store.getValue('selectedProfileId');
								const finalRow =
									typeof row_ === 'object' &&
									row_ !== null &&
									tableId_ !== 'profiles' &&
									selectedProfileId
										? { ...row_, profileId: selectedProfileId }
										: row_;
								store.setRow(tableId_, rowId_, finalRow);
								resolve();
							} else {
								setTimeout(checkStore, 50);
							}
						};
						checkStore();
					});
				},
				{ row, rowId, tableId },
			);
		}
	}
}

export async function enableSkipProfile(pageOrContext: BrowserContext | Page) {
	const profileId = 'e2e-baby-id';
	await setTinyBaseRow(pageOrContext, 'profiles', profileId, {
		birthday: '2024-01-01',
		color: 'bg-blue-500',
		dob: '2024-01-01',
		id: profileId,
		name: 'E2E Baby',
		optedOut: false,
		sex: 'girl',
	});
	await setTinyBaseValue(pageOrContext, 'selectedProfileId', profileId);
	if ('evaluate' in pageOrContext) {
		// Close any open dialogs that might be blocking the UI (like the profile prompt itself if it was already open)
		await (pageOrContext as Page).evaluate(() => {
			const backdrop = document.querySelector('[data-base-ui-portal]');
			if (backdrop) {
				backdrop.remove();
			}
			document.body.style.pointerEvents = 'auto';
			document.body.style.overflow = 'auto';
		});
	}
}

type Fixtures = {
	skipProfile: void;
};

export const test = base.extend<Fixtures>({
	context: async ({ context }, use) => {
		await context.addInitScript(() => {
			(window as unknown as { __E2E_TESTS__: boolean }).__E2E_TESTS__ = true;
		});
		// eslint-disable-next-line react-hooks/rules-of-hooks
		await use(context);
	},
	skipProfile: [
		async ({ context }, use) => {
			await enableSkipProfile(context);
			await use();
		},
		{ auto: true },
	],
});

export { expect };
