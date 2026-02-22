import { describe, expect, it } from 'vitest';
import {
	getGrowthRange,
	getPercentile,
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

	describe('getPercentile', () => {
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
	});
});
