import type { Sex } from '@/types/profile';

// Z-scores for 3rd and 97th percentiles
export const Z_3RD = -1.880_79;
export const Z_97TH = 1.880_79;

/**
 * Calculates the value for a given L, M, S and Z-score.
 * Formula: X = M * (1 + L * S * Z)^(1/L)
 */
export function calculateValue(
	L: number,
	M: number,
	S: number,
	Z: number,
): number {
	if (L === 0) {
		return M * Math.exp(S * Z);
	}
	return M * Math.pow(1 + L * S * Z, 1 / L);
}

export interface GrowthRange {
	max: number;
	min: number;
}

export interface LmsData {
	age: number;
	L: number;
	M: number;
	S: number;
}

/**
 * Finds the closest LMS values for a given age.
 * WHO data is typically daily (0-5y) or monthly (5-19y).
 */
export function lookupLms(table: LmsData[], age: number): LmsData | null {
	if (!table || table.length === 0) return null;

	// Simple binary search for the closest age
	let low = 0;
	let high = table.length - 1;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		if (table[mid].age === age) return table[mid];
		if (table[mid].age < age) low = mid + 1;
		else high = mid - 1;
	}

	// Return the closest one
	if (low >= table.length) return table.at(-1) || null;
	if (high < 0) return table[0];

	const d1 = Math.abs(table[low].age - age);
	const d2 = Math.abs(table[high].age - age);

	return d1 < d2 ? table[low] : table[high];
}

export async function getGrowthTable(
	indicator:
		| 'weight-for-age'
		| 'length-height-for-age'
		| 'head-circumference-for-age',
	sex: Sex,
	ageInDays: number,
): Promise<{ index: number; table: LmsData[] } | null> {
	const sexKey = sex === 'boy' ? 'boys' : 'girls';
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

	try {
		const dataModule = await import(`../data/growth-standards/${tableKey}.json`);
		return { index, table: dataModule.default as LmsData[] };
	} catch {
		return null;
	}
}

export async function getGrowthRange(
	indicator:
		| 'weight-for-age'
		| 'length-height-for-age'
		| 'head-circumference-for-age',
	sex: Sex,
	ageInDays: number,
): Promise<GrowthRange | null> {
	try {
		const result = await getGrowthTable(indicator, sex, ageInDays);
		if (!result) return null;

		const { index, table } = result;
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
		return null;
	}
}
