import { describe, expect, it } from 'vitest';
import { dateToDateInputValue } from './date-to-date-input-value';

describe('dateToDateInputValue', () => {
	it('should format date to yyyy-MM-dd correctly for both string and Date inputs', () => {
		// Test with string input
		expect(dateToDateInputValue('2023-05-15')).toBe('2023-05-15');

		// Test with Date object
		const date = new Date(2023, 4, 15); // Month is 0-indexed, so 4 is May
		expect(dateToDateInputValue(date)).toBe('2023-05-15');
	});
});
