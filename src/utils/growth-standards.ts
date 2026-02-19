import { loadTable, lookupLms } from '@pedi-growth/core';
import type { Sex } from '@/types/profile';

// Z-scores for 3rd and 97th percentiles
const Z_3RD = -1.880_79;
const Z_97TH = 1.880_79;

/**
 * Calculates the value for a given L, M, S and Z-score.
 * Formula: X = M * (1 + L * S * Z)^(1/L)
 */
function calculateValue(L: number, M: number, S: number, Z: number): number {
	if (L === 0) {
		return M * Math.exp(S * Z);
	}
	return M * Math.pow(1 + L * S * Z, 1 / L);
}

export interface GrowthRange {
	max: number;
	min: number;
}

export async function getGrowthRange(
	indicator:
		| 'weight-for-age'
		| 'length-height-for-age'
		| 'head-circumference-for-age',
	sex: Sex,
	ageInDays: number,
): Promise<GrowthRange | null> {
	const sexKey = sex === 'boy' ? 'boys' : 'girls';

	try {
		let tableKey = '';
		let index = ageInDays;

		switch (indicator) {
			case 'weight-for-age':
				if (ageInDays <= 1856) {
					tableKey = `wfa-${sexKey}-0-5`;
				} else {
					tableKey = `wfa-${sexKey}-5-10`;
					index = ageInDays / 30.4375; // WHO uses months for 5-10
				}
				break;
			case 'length-height-for-age':
				if (ageInDays <= 1856) {
					tableKey = `lhfa-${sexKey}-0-5`;
				} else {
					tableKey = `hfa-${sexKey}-5-19`;
					index = ageInDays / 30.4375;
				}
				break;
			case 'head-circumference-for-age':
				if (ageInDays <= 1856) {
					tableKey = `hcfa-${sexKey}-0-5`;
				} else {
					return null; // HC only for 0-5
				}
				break;
		}

		if (!tableKey) return null;

		const table = await loadTable(tableKey as Parameters<typeof loadTable>[0]);
		if (!table) return null;

		const lms = lookupLms(table, index);
		if (!lms) return null;

		const min = calculateValue(lms.L, lms.M, lms.S, Z_3RD);
		const max = calculateValue(lms.L, lms.M, lms.S, Z_97TH);

		// weight is in kg in WHO data, we use g in our app
		if (indicator === 'weight-for-age') {
			return {
				max: max * 1000,
				min: min * 1000,
			};
		}

		return { max, min };
	} catch {
		// Silent error
		return null;
	}
}
