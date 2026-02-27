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
		const fallbackAverageCost = 0.3;
		const result = calculateDiaperSavings(changes, brands, fallbackAverageCost);

		// Potty training savings: 1 clean pampers = 0.25
		expect(result.pottyTrainingSavings).toBe(0.25);

		// Reusable savings: 1 stoffy use saves (avg(disposables) - 0.05)
		// Disposables are both 0.25, so avg is 0.25.
		// 0.25 - 0.05 = 0.20
		expect(result.reusableSavings).toBe(0.2);

		// Total savings: 0.25 + 0.20 - 100 = -99.55
		expect(result.totalSavings).toBe(-99.55);

		// Brand spending:
		// Pampers: 2 uses * 0.25 = 0.50
		// Stoffy: 1 use * 0.05 = 0.05
		expect(result.topBrandsSpending).toHaveLength(2);
		const pampers = result.topBrandsSpending.find(
			(b) => b.brandId === 'pampers',
		);
		const stoffy = result.topBrandsSpending.find((b) => b.brandId === 'stoffy');

		expect(pampers?.totalSpend).toBe(0.5);
		expect(pampers?.usageCount).toBe(2);
		expect(stoffy?.totalSpend).toBe(0.05);
		expect(stoffy?.usageCount).toBe(1);
	});

	it('should use dynamic average cost from surrounding disposables', () => {
		const testBrands: DiaperBrand[] = [
			{
				costPerDiaper: 0.1,
				id: 'size1',
				isReusable: false,
				name: 'Size 1',
				upfrontCost: 0,
			},
			{
				costPerDiaper: 0.5,
				id: 'size2',
				isReusable: false,
				name: 'Size 2',
				upfrontCost: 0,
			},
			{
				costPerDiaper: 0,
				id: 'cloth',
				isReusable: true,
				name: 'Cloth',
				perUseCost: 0.05,
				upfrontCost: 100,
			},
		];

		const testChanges: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'size1',
				id: '1',
				timestamp: '2024-01-01T10:00:00Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'size1',
				id: '2',
				timestamp: '2024-01-01T11:00:00Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'cloth',
				id: '3',
				timestamp: '2024-01-01T12:00:00Z',
			}, // Should use 0.1 (avg of disposables so far)
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'size2',
				id: '4',
				timestamp: '2024-02-01T10:00:00Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'size2',
				id: '5',
				timestamp: '2024-02-01T11:00:00Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'cloth',
				id: '6',
				timestamp: '2024-02-01T12:00:00Z',
			}, // Should use avg(0.1, 0.1, 0.5, 0.5) = 0.3
		];

		const result = calculateDiaperSavings(testChanges, testBrands, 0.25);

		// First cloth use: saving = avg(0.1, 0.1, 0.5, 0.5) - 0.05 = 0.3 - 0.05 = 0.25
		// Second cloth use: saving = avg(0.1, 0.1, 0.5, 0.5) - 0.05 = 0.3 - 0.05 = 0.25
		// Total reusable savings = 0.50
		expect(result.reusableSavings).toBeCloseTo(0.5);
	});
});
