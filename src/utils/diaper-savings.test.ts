import { describe, expect, it } from 'vitest';
import { DiaperChange } from '@/types/diaper';
import { DiaperBrand } from '@/types/diaper-brand';
import { calculateDiaperSavings } from './diaper-savings';

describe('calculateDiaperSavings', () => {
	const brands: DiaperBrand[] = [
		{
			costPerDiaper: 0.25,
			id: 'pampers',
			isReusable: false,
			name: 'Pampers',
			upfrontCost: 0,
		},
		{
			costPerDiaper: 0,
			id: 'stoffy',
			isReusable: true,
			name: 'Stoffy',
			perUseCost: 0.05,
			upfrontCost: 100,
		},
	];

	const changes: DiaperChange[] = [
		{
			containsStool: false,
			containsUrine: true,
			diaperBrand: 'pampers',
			id: '1',
			timestamp: '2024-01-01T10:00:00Z',
		},
		{
			containsStool: false,
			containsUrine: false,
			diaperBrand: 'pampers', // Clean because of potty
			id: '2',
			pottyUrine: true,
			timestamp: '2024-01-01T14:00:00Z',
		},
		{
			containsStool: false,
			containsUrine: true,
			diaperBrand: 'stoffy',
			id: '3',
			timestamp: '2024-01-02T10:00:00Z',
		},
	];

	it('should calculate savings and brand spending correctly', () => {
		const averageCost = 0.3;
		const result = calculateDiaperSavings(changes, brands, averageCost);

		// Potty training savings: 1 clean pampers = 0.25
		expect(result.pottyTrainingSavings).toBe(0.25);

		// Reusable savings: 1 stoffy use saves (0.3 - 0.05) = 0.25
		expect(result.reusableSavings).toBe(0.25);

		// Total savings: 0.25 + 0.25 - 100 = -99.50
		expect(result.totalSavings).toBe(-99.5);

		// Brand savings:
		// Pampers: 1 potty hit * 0.25 = 0.25
		// Stoffy: 1 use * (0.3 - 0.05) - 100 upfront = -99.75
		expect(result.topBrandsSavings).toHaveLength(2);
		const pampers = result.topBrandsSavings.find(
			(b) => b.brandId === 'pampers',
		);
		const stoffy = result.topBrandsSavings.find((b) => b.brandId === 'stoffy');

		expect(pampers?.totalSavings).toBe(0.25);
		expect(pampers?.usageCount).toBe(2);
		expect(stoffy?.totalSavings).toBe(-99.75);
		expect(stoffy?.usageCount).toBe(1);
	});
});
