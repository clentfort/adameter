import {  describe, expect, it, } from 'vitest';
import { formatDurationAbbreviated } from './format-duration-abbreviated';


describe('formatDurationAbbreviated', () => {
	it('should format duration with hours and minutes', () => {
		expect(formatDurationAbbreviated(13_500)).toBe('3 h 45 min');
	});

	it('should format duration with only hours (exact hours)', () => {
		expect(formatDurationAbbreviated(7200)).toBe('2 h');
	});

	it('should format duration with only minutes', () => {
		expect(formatDurationAbbreviated(1800)).toBe('30 min');
	});

	it('should format duration less than a minute as 0 min', () => {
		expect(formatDurationAbbreviated(45)).toBe('0 min');
	});

	it('should format zero seconds as 0 min', () => {
		expect(formatDurationAbbreviated(0)).toBe('0 min');
	});

	it('should handle negative numbers by treating them as 0', () => {
		expect(formatDurationAbbreviated(-100)).toBe('0 min');
	});

	it('should format duration with 1 hour and 1 minute', () => {
		expect(formatDurationAbbreviated(3660)).toBe('1 h 1 min');
	});

	it('should format duration with 1 hour and 0 minutes (displays as 1 h)', () => {
		expect(formatDurationAbbreviated(3600)).toBe('1 h');
	});

	it('should format duration with 0 hours and 1 minute (displays as 1 min)', () => {
		expect(formatDurationAbbreviated(60)).toBe('1 min');
	});
});
