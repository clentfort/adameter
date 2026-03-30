import { describe, expect, it } from 'vitest';
import { getToothName } from './teething';

describe('getToothName', () => {
	it('returns correct localized names for various FDI tooth numbers to cover all branches', () => {
		const testCases = [
			{ expected: 'Upper Right Central Incisor', id: 51 },
			{ expected: 'Upper Left Lateral Incisor', id: 62 },
			{ expected: 'Lower Left Canine', id: 73 },
			{ expected: 'Lower Right First Molar', id: 84 },
			{ expected: 'Upper Right Second Molar', id: 55 },
		];

		testCases.forEach(({ expected, id }) => {
			expect(getToothName(id)).toBe(expected);
		});
	});
});
