import { format } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import {
	formatDisplayDate,
	formatEntryTime,
	formatSectionDate,
} from './format-history-date';

describe('format-history-date', () => {
	describe('formatSectionDate', () => {
		it('returns "Today" for current date', () => {
			const today = new Date('2024-05-20T12:00:00Z');
			vi.setSystemTime(today);
			expect(formatSectionDate('2024-05-20')).toBe('Today');
			vi.useRealTimers();
		});

		it('returns "Yesterday" for previous date', () => {
			const today = new Date('2024-05-20T12:00:00Z');
			vi.setSystemTime(today);
			expect(formatSectionDate('2024-05-19')).toBe('Yesterday');
			vi.useRealTimers();
		});

		it('formats date without year if same year', () => {
			const today = new Date('2024-05-20T12:00:00Z');
			vi.setSystemTime(today);
			// format(new Date('2024-01-01'), 'EEEE, d. MMMM') -> Monday, 1. January
			expect(formatSectionDate('2024-01-01')).toBe('Monday, 1. January');
			vi.useRealTimers();
		});

		it('formats date with year if different year', () => {
			const today = new Date('2024-05-20T12:00:00Z');
			vi.setSystemTime(today);
			expect(formatSectionDate('2023-12-31')).toBe('Sunday, 31. December 2023');
			vi.useRealTimers();
		});

		it('returns original string if invalid date', () => {
			expect(formatSectionDate('not-a-date')).toBe('not-a-date');
		});
	});

	describe('formatEntryTime', () => {
		it('formats ISO timestamp to time string', () => {
			// 'p' format is locale-dependent, but in tests it usually defaults to h:mm a
			// We check if it returns a string that matches the expected format
			const result = formatEntryTime('2024-05-20T14:30:00Z');
			expect(result).toMatch(/^\d{1,2}:\d{2}/);
		});

		it('uses custom format string', () => {
			expect(formatEntryTime('2024-05-20T14:30:00Z', 'HH:mm')).toBe('14:30');
		});

		it('returns empty string for non-string input', () => {
			expect(formatEntryTime(null)).toBe('');
			expect(formatEntryTime(undefined)).toBe('');
		});

		it('returns original string for invalid date', () => {
			expect(formatEntryTime('invalid')).toBe('invalid');
		});
	});

	describe('formatDisplayDate', () => {
		it('formats ISO date to display string', () => {
			expect(formatDisplayDate('2024-05-20')).toBe('20. May 2024');
		});

		it('returns original string for invalid date', () => {
			expect(formatDisplayDate('invalid')).toBe('invalid');
		});
	});
});
