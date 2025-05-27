import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDurationLocale } from './format-duration-locale';

describe('formatDurationLocale', () => {
	describe('with Intl.DurationFormat available', () => {
		// These tests run only if Intl.DurationFormat is genuinely available and not mocked
		const ifIntlDurationFormatAvailable =
			typeof Intl !== 'undefined' && typeof Intl.DurationFormat !== 'undefined';

		it.skipIf(!ifIntlDurationFormatAvailable)(
			'should format with hours, minutes, and seconds (e.g., en-US style: short)',
			() => {
				// Example output for en-US, style: 'short'. Actual output can vary by locale/environment.
				// We expect something like "1 hr, 30 min, 15 sec" or "1h 30m 15s" if Intl.DurationFormat uses that.
				// The key is that it's processed by Intl.DurationFormat.
				// For 'en', style 'short' typically gives "1 hr, 30 min, 15 sec".
				const result = formatDurationLocale({
					hours: 1,
					minutes: 30,
					seconds: 15,
				});
				expect(result).toMatch(/1\s*hr(s?)/i);
				expect(result).toMatch(/30\s*min(s?)/i);
				expect(result).toMatch(/15\s*sec(s?)/i);
			},
		);

		it.skipIf(!ifIntlDurationFormatAvailable)(
			'should format with minutes and seconds (e.g., en-US style: short)',
			() => {
				const result = formatDurationLocale({ minutes: 15, seconds: 30 });
				expect(result).toMatch(/15\s*min(s?)/i);
				expect(result).toMatch(/30\s*sec(s?)/i);
				expect(result).not.toMatch(/hr(s?)/i);
			},
		);

		it.skipIf(!ifIntlDurationFormatAvailable)(
			'should format with only seconds (e.g., en-US style: short)',
			() => {
				const result = formatDurationLocale({ seconds: 45 });
				expect(result).toMatch(/45\s*sec(s?)/i);
				expect(result).not.toMatch(/min(s?)/i);
				expect(result).not.toMatch(/hr(s?)/i);
			},
		);

		it.skipIf(!ifIntlDurationFormatAvailable)(
			'should format with only hours (e.g., en-US style: short)',
			() => {
				const result = formatDurationLocale({ hours: 2 });
				expect(result).toMatch(/2\s*hr(s?)/i);
				expect(result).not.toMatch(/min(s?)/i);
				expect(result).not.toMatch(/sec(s?)/i);
			},
		);
		
		it.skipIf(!ifIntlDurationFormatAvailable)(
			'should return an empty string for all zero duration when Intl.DurationFormat is used',
			() => {
				// Intl.DurationFormat with style:'short' for {seconds:0} etc. typically returns empty or "0s"
				// The implementation falls back to "0s" if Intl returns empty for non-zero,
				// but for all-zero, Intl itself might return "" or "0s".
				// The current implementation of formatDurationLocale's Intl branch returns the direct output.
				// date-fns/formatDuration with zero:false returns "" for zero duration.
				// Let's assume for 'en' and 'short' style, an all-zero duration might be empty or like "0 sec".
				// If it's empty, our fallback in the main code doesn't trigger for all-zero.
				// The fallback section explicitly tests "0s".
				// This test checks what Intl.DurationFormat branch does with all-zero.
				const result = formatDurationLocale({
					hours: 0,
					minutes: 0,
					seconds: 0,
				});
				// Expect either empty or some form of "0 seconds"
				expect(result === '' || result.includes('0')).toBe(true);
			},
		);
	});

	describe('with Intl.DurationFormat NOT available (fallback mechanism)', () => {
		let originalIntl;

		beforeEach(() => {
			originalIntl = global.Intl;
			global.Intl = { ...originalIntl, DurationFormat: undefined } as any;
		});

		afterEach(() => {
			global.Intl = originalIntl;
		});

		it('should format with hours, minutes, and seconds using fallback', () => {
			expect(
				formatDurationLocale({ hours: 1, minutes: 30, seconds: 15 }),
			).toBe('1h 30m 15s');
		});

		it('should format with minutes and seconds using fallback', () => {
			expect(formatDurationLocale({ minutes: 15, seconds: 30 })).toBe(
				'15m 30s',
			);
		});

		it('should format with only seconds using fallback', () => {
			expect(formatDurationLocale({ seconds: 45 })).toBe('45s');
		});

		it('should format with only hours using fallback', () => {
			expect(formatDurationLocale({ hours: 2 })).toBe('2h');
		});

		it('should format with hours and seconds (minutes zero) using fallback', () => {
			expect(formatDurationLocale({ hours: 1, minutes: 0, seconds: 5 })).toBe(
				'1h 5s',
			);
		});

		it('should return "0s" for all zero duration using fallback', () => {
			expect(
				formatDurationLocale({ hours: 0, minutes: 0, seconds: 0 }),
			).toBe('0s');
		});
	});
});
