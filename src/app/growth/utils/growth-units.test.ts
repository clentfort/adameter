import type { GrowthFormData, GrowthFormValues } from '@/types/growth';
import { describe, expect, it } from 'vitest';
import { toDisplayValues, toMetric } from './growth-units';

describe('growth-units', () => {
	describe('toDisplayValues', () => {
		const baseValues: GrowthFormValues = {
			date: '2026-03-30',
			headCircumference: '35',
			height: '50',
			notes: 'Healthy baby',
			weight: '3500',
		};

		it('returns values unmodified when isImperial is false', () => {
			const result = toDisplayValues(baseValues, false);
			expect(result).toEqual(baseValues);
			expect(result).not.toBe(baseValues);
		});

		it('converts weight, height, and headCircumference to imperial when isImperial is true', () => {
			const result = toDisplayValues(baseValues, true);
			expect(result).toEqual({
				date: '2026-03-30',
				headCircumference: '13.8',
				height: '19.7',
				notes: 'Healthy baby',
				weight: '7.7',
			});
		});

		it('handles empty string fields correctly in imperial mode', () => {
			const emptyValues: GrowthFormValues = {
				date: '2026-03-30',
				headCircumference: '',
				height: '',
				notes: '',
				weight: '',
			};
			const result = toDisplayValues(emptyValues, true);
			expect(result).toEqual(emptyValues);
		});

		it('leaves invalid numeric string fields unchanged if parseFloat returns NaN', () => {
			const invalidValues: GrowthFormValues = {
				date: '2026-03-30',
				headCircumference: 'invalid',
				height: 'invalid',
				notes: '',
				weight: 'invalid',
			};
			const result = toDisplayValues(invalidValues, true);
			expect(result).toEqual(invalidValues);
		});
	});

	describe('toMetric', () => {
		const baseData: GrowthFormData = {
			date: '2026-03-30T12:00:00.000Z',
			headCircumference: 13.8,
			height: 19.7,
			notes: 'Healthy baby',
			weight: 7.7,
		};

		it('returns data unmodified when isImperial is false', () => {
			const metricData: GrowthFormData = {
				date: '2026-03-30T12:00:00.000Z',
				headCircumference: 35,
				height: 50,
				notes: 'Healthy baby',
				weight: 3500,
			};
			const result = toMetric(metricData, false);
			expect(result).toEqual(metricData);
		});

		it('converts weight, height, and headCircumference to metric with rounding when isImperial is true', () => {
			const result = toMetric(baseData, true);
			expect(result).toEqual({
				date: '2026-03-30T12:00:00.000Z',
				headCircumference: 35.1,
				height: 50,
				notes: 'Healthy baby',
				weight: 3493,
			});
		});

		it('handles undefined optional measurement fields in imperial mode', () => {
			const partialData: GrowthFormData = {
				date: '2026-03-30T12:00:00.000Z',
				notes: '',
				weight: 7.7,
			};
			const result = toMetric(partialData, true);
			expect(result).toEqual({
				date: '2026-03-30T12:00:00.000Z',
				headCircumference: undefined,
				height: undefined,
				notes: '',
				weight: 3493,
			});
		});
	});
});
