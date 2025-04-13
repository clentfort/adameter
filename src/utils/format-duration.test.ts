import { describe, expect, it } from 'vitest';
import { formatDurationShort } from './format-duration-short';

describe('formatDurationShort', () => {
	it('formats a duration that is less than a minute', () => {
		const duration = { seconds: 45 };
		const result = formatDurationShort(duration);
		expect(result).toBe('00:45');
	});

	it('formats a duration that is less than an hour', () => {
		const duration = { minutes: 5, seconds: 30 };
		const result = formatDurationShort(duration);
		expect(result).toBe('05:30');
	});

	it('formats a duration that is more than an hour', () => {
		const duration = { hours: 1, minutes: 15, seconds: 45 };
		const result = formatDurationShort(duration);
		expect(result).toBe('75:45');
	});
});
