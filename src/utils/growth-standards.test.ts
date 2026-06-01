import { describe, expect, it } from 'vitest';
import {
	getGrowthRange,
	getPercentile,
	lookupLms,
	zScoreToPercentile,
} from './growth-standards';

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

	describe('zScoreToPercentile', () => {
		it('should convert 0 to 50%', () => {
			expect(zScoreToPercentile(0)).toBeCloseTo(0.5);
		});

		it('should convert -1.88079 to 3%', () => {
			expect(zScoreToPercentile(-1.880_79)).toBeCloseTo(0.03, 2);
		});

		it('should convert 1.88079 to 97%', () => {
			expect(zScoreToPercentile(1.880_79)).toBeCloseTo(0.97, 2);
		});
	});

	describe('lookupLms', () => {
		const mockTable = [
			{ age: 10, L: 1, M: 1, S: 1 },
			{ age: 20, L: 2, M: 2, S: 2 },
			{ age: 30, L: 3, M: 3, S: 3 },
		];

		it('should return null for empty table', () => {
			expect(lookupLms([], 15)).toBeNull();
		});

		it('should return the first entry if age is below range', () => {
			expect(lookupLms(mockTable, 5)).toEqual(mockTable[0]);
		});

		it('should return the last entry if age is above range', () => {
			expect(lookupLms(mockTable, 35)).toEqual(mockTable[2]);
		});

		it('should return the closest entry if age is between values (closer to low)', () => {
			expect(lookupLms(mockTable, 12)).toEqual(mockTable[0]);
		});

		it('should return the closest entry if age is between values (closer to high)', () => {
			expect(lookupLms(mockTable, 18)).toEqual(mockTable[1]);
		});

		it('should return the exact entry if age matches', () => {
			expect(lookupLms(mockTable, 20)).toEqual(mockTable[1]);
		});
	});

	describe('getPercentile', () => {
		it('should return null if table is empty or missing', async () => {
			const p = await getPercentile(
				'head-circumference-for-age',
				'boy',
				3000,
				30,
			);
			expect(p).toBeNull();
		});

		it('should return around 50 for a median weight baby', async () => {
			// A boy at birth (0 days) with median weight (around 3.3kg)
			const p = await getPercentile('weight-for-age', 'boy', 0, 3346);
			expect(p).not.toBeNull();
			expect(p).toBeGreaterThan(45);
			expect(p).toBeLessThan(55);
		});

		it('should return around 3 for a 3rd percentile weight baby', async () => {
			const range = await getGrowthRange('weight-for-age', 'boy', 0);
			const p = await getPercentile('weight-for-age', 'boy', 0, range!.min);
			expect(p).toBeCloseTo(3, 1);
		});

		it('should return around 97 for a 97th percentile weight baby', async () => {
			const range = await getGrowthRange('weight-for-age', 'boy', 0);
			const p = await getPercentile('weight-for-age', 'boy', 0, range!.max);
			expect(p).toBeCloseTo(97, 1);
		});

		it('should handle head circumference for age', async () => {
			const range = await getGrowthRange(
				'head-circumference-for-age',
				'girl',
				100,
			);
			expect(range).not.toBeNull();
			expect(range?.min).toBeGreaterThan(30);
			expect(range?.max).toBeLessThan(50);

			const p = await getPercentile(
				'head-circumference-for-age',
				'girl',
				100,
				range!.min,
			);
			expect(p).toBeCloseTo(3, 1);
		});

		it('should return null for head circumference if age > 5 years', async () => {
			const range = await getGrowthRange(
				'head-circumference-for-age',
				'boy',
				2000,
			);
			expect(range).toBeNull();
		});

		it('should return null for height for age over 5 years (missing data)', async () => {
			const range = await getGrowthRange('length-height-for-age', 'boy', 2000);
			expect(range).toBeNull();
		});

		it('should return null for weight for age over 5 years (missing data)', async () => {
			const range = await getGrowthRange('weight-for-age', 'girl', 2000);
			expect(range).toBeNull();
		});
	});
});
