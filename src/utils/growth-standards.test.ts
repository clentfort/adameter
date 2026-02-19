import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getGrowthRange } from './growth-standards';

vi.mock('@pedi-growth/core', async (importOriginal) => {
	const original = await importOriginal<typeof import('@pedi-growth/core')>();
	return {
		...original,
		loadTable: vi.fn(async (name: string) => {
			const filePath = join(
				process.cwd(),
				'node_modules/@pedi-growth/core/dist/data',
				`${name}.json`,
			);
			const content = readFileSync(filePath, 'utf8');
			return JSON.parse(content);
		}),
	};
});

describe('growth-standards', () => {
	it('should return weight range for a 0-day old boy', async () => {
		const range = await getGrowthRange('weight-for-age', 'boy', 0);
		expect(range).not.toBeNull();
		// Birth weight for boys 3rd percentile is around 2.5kg, 97th is around 4.3kg
		expect(range?.min).toBeGreaterThan(2000);
		expect(range?.min).toBeLessThan(3000);
		expect(range?.max).toBeGreaterThan(4000);
		expect(range?.max).toBeLessThan(5000);
	});

	it('should return weight range for a 1-year old girl', async () => {
		const range = await getGrowthRange('weight-for-age', 'girl', 365);
		expect(range).not.toBeNull();
		// 1 year old girl weight is roughly 7kg to 11.5kg
		expect(range?.min).toBeGreaterThan(6000);
		expect(range?.max).toBeGreaterThan(11_000);
	});

	it('should return height range for a 2-year old boy', async () => {
		const range = await getGrowthRange('length-height-for-age', 'boy', 730);
		expect(range).not.toBeNull();
		// 2 year old boy height is roughly 81cm to 93cm
		expect(range?.min).toBeGreaterThan(80);
		expect(range?.max).toBeLessThan(100);
	});
});
