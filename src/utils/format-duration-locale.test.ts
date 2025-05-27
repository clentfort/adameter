import { describe, it, expect } from 'vitest';
import { formatDurationLocale } from './format-duration-locale';

describe('formatDurationLocale', () => {
	// Tests assume Intl.DurationFormat is available and not mocked,
	// as per the updated function design.
	describe('Intl.DurationFormat behavior', () => {
		it('should format with hours, minutes, and seconds (e.g., en-US style: short)', () => {
			// Example output for en-US, style: 'short'. Actual output can vary by locale/environment.
			// For 'en', style 'short' typically gives "1 hr, 30 min, 15 sec".
			const result = formatDurationLocale({
				hours: 1,
				minutes: 30,
				seconds: 15,
			});
			// These regexes are broad to accommodate different locale outputs for "short" style.
			expect(result).toMatch(/1\s*h(r?)/i); // Matches "1h", "1 h", "1hr", "1 hr"
			expect(result).toMatch(/30\s*m(in)?/i); // Matches "30m", "30 m", "30min", "30 min"
			expect(result).toMatch(/15\s*s(ec)?/i); // Matches "15s", "15 s", "15sec", "15 sec"
		});

		it('should format with minutes and seconds (e.g., en-US style: short)', () => {
			const result = formatDurationLocale({ minutes: 15, seconds: 30 });
			expect(result).toMatch(/15\s*m(in)?/i);
			expect(result).toMatch(/30\s*s(ec)?/i);
			expect(result).not.toMatch(/h(r?)/i);
		});

		it('should format with only seconds (e.g., en-US style: short)', () => {
			const result = formatDurationLocale({ seconds: 45 });
			expect(result).toMatch(/45\s*s(ec)?/i);
			expect(result).not.toMatch(/m(in)?/i);
			expect(result).not.toMatch(/h(r?)/i);
		});

		it('should format with only hours (e.g., en-US style: short)', () => {
			const result = formatDurationLocale({ hours: 2 });
			expect(result).toMatch(/2\s*h(r?)/i);
			expect(result).not.toMatch(/m(in)?/i);
			expect(result).not.toMatch(/s(ec)?/i);
		});

		it('should return an empty string or a zero-value string for all zero duration when Intl.DurationFormat is used', () => {
			// Intl.DurationFormat with style:'short' for {seconds:0} etc. might return empty or "0s"
			// depending on the locale and specific implementation.
			// For example, in Node 18+ 'en-US', {style:'short'} for zero duration gives "0 sec".
			// In some browsers, it might be an empty string.
			// The function now directly returns what Intl.DurationFormat provides.
			const result = formatDurationLocale({
				hours: 0,
				minutes: 0,
				seconds: 0,
			});
			// Accommodate common outputs for zero duration: empty string, or contains "0".
			expect(result === '' || result.includes('0')).toBe(true);
		});
	});
});
