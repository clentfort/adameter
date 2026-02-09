import { describe, expect, it } from 'vitest';
import { dateToTimeInputValue } from './date-to-time-input-value';

describe('dateToTimeInputValue', () => {
	it('should format date to HH:mm correctly for both string and Date inputs', () => {
		// Test with string input
		expect(dateToTimeInputValue('2023-05-15T14:30:00')).toBe('14:30');

		// Test with Date object
		const date = new Date(2023, 4, 15, 9, 5); // 2023-05-15 09:05
		expect(dateToTimeInputValue(date)).toBe('09:05');
	});
});
