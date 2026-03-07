import { describe, expect, it } from 'vitest';
import { parseDiaperFormValues, parseDiaperProductFormValues } from './diaper';

describe('diaper schema transforms', () => {
	it('parses diaper product form values into persisted data', () => {
		expect(
			parseDiaperProductFormValues({
				costPerDiaper: '0.37',
				isReusable: true,
				name: '  Pampers  ',
				upfrontCost: '12.50',
			}),
		).toEqual({
			costPerDiaper: 0.37,
			isReusable: true,
			name: 'Pampers',
			upfrontCost: 12.5,
		});
	});

	it('drops upfront cost for non-reusable diaper products', () => {
		expect(
			parseDiaperProductFormValues({
				costPerDiaper: '0.37',
				isReusable: false,
				name: 'Pampers',
				upfrontCost: '12.50',
			}),
		).toEqual({
			costPerDiaper: 0.37,
			isReusable: false,
			name: 'Pampers',
			upfrontCost: undefined,
		});
	});

	it('parses diaper form values into persisted change data', () => {
		expect(
			parseDiaperFormValues({
				containsStool: false,
				containsUrine: true,
				date: '2026-03-07',
				diaperProductId: '',
				leakage: false,
				notes: '  Rash improved  ',
				pottyStool: false,
				pottyUrine: true,
				temperature: '37.2',
				time: '08:15',
			}),
		).toEqual({
			containsStool: false,
			containsUrine: true,
			diaperProductId: undefined,
			leakage: undefined,
			notes: 'Rash improved',
			pottyStool: false,
			pottyUrine: true,
			temperature: 37.2,
			timestamp: '2026-03-07T08:15:00.000Z',
		});
	});
});
