import type { Page } from '@playwright/test';
import { setTinyBaseRow } from '../fixtures/test';

export async function seedDiaperChange(
	page: Page,
	entry: {
		containsStool: boolean;
		containsUrine: boolean;
		diaperProductId?: string;
		leakage?: boolean;
		pottyStool?: boolean;
		pottyUrine?: boolean;
		timestamp: string;
	},
) {
	const id = Math.random().toString(36).slice(7);
	await setTinyBaseRow(page, 'diaperChanges', id, {
		containsStool: entry.containsStool,
		containsUrine: entry.containsUrine,
		diaperProductId: entry.diaperProductId,
		id,
		leakage: entry.leakage,
		pottyStool: entry.pottyStool,
		pottyUrine: entry.pottyUrine,
		timestamp: entry.timestamp,
	});
}
