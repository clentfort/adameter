import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use the shared mock for fbtee. This is critical.
vi.mock('fbtee', async () => vi.importActual<typeof import('@/vitest.fbtee-mock')>('@/vitest.fbtee-mock'));

import { DEFAULT_LOCALE, setLocale } from '@/i18n';
import { fbt } from 'fbtee';
import { formatDurationAbbreviated } from './format-duration-abbreviated';

const fbtMock = fbt as vi.Mock;

describe('formatDurationAbbreviated', () => {
	beforeEach(async () => {
		await setLocale(DEFAULT_LOCALE);
		fbtMock.mockClear();
	});

	it('should format duration with hours and minutes', () => {
		const hours = 3;
		const minutes = 45;
		expect(formatDurationAbbreviated(13500)).toBe('3 h 45 min');
		// Check the exact template string passed by babel-plugin-fbtee
		expect(fbtMock).toHaveBeenCalledWith('{count} h', null, expect.objectContaining({ params: { count: hours }, hk: expect.any(String) }));
		expect(fbtMock).toHaveBeenCalledWith('{count} min', null, expect.objectContaining({ params: { count: minutes }, hk: expect.any(String) }));
	});

	it('should format duration with only hours (exact hours)', () => {
		const hours = 2;
		expect(formatDurationAbbreviated(7200)).toBe('2 h');
		expect(fbtMock).toHaveBeenCalledWith('{count} h', null, expect.objectContaining({ params: { count: hours }, hk: expect.any(String) }));
	});

	it('should format duration with only minutes', () => {
		const minutes = 30;
		expect(formatDurationAbbreviated(1800)).toBe('30 min');
		expect(fbtMock).toHaveBeenCalledWith('{count} min', null, expect.objectContaining({ params: { count: minutes }, hk: expect.any(String) }));
	});

	it('should format duration less than a minute as 0 min', () => {
		expect(formatDurationAbbreviated(45)).toBe('0 min');
		expect(fbtMock).toHaveBeenCalledWith('0 min', null, expect.objectContaining({ hk: expect.any(String) }));
	});

	it('should format zero seconds as 0 min', () => {
		expect(formatDurationAbbreviated(0)).toBe('0 min');
		expect(fbtMock).toHaveBeenCalledWith('0 min', null, expect.objectContaining({ hk: expect.any(String) }));
	});

	it('should handle negative numbers by treating them as 0', () => {
		expect(formatDurationAbbreviated(-100)).toBe('0 min');
		expect(fbtMock).toHaveBeenCalledWith('0 min', null, expect.objectContaining({ hk: expect.any(String) }));
	});

	it('should format duration with 1 hour and 1 minute', () => {
		const hours = 1;
		const minutes = 1;
		expect(formatDurationAbbreviated(3660)).toBe('1 h 1 min');
		expect(fbtMock).toHaveBeenCalledWith('{count} h', null, expect.objectContaining({ params: { count: hours }, hk: expect.any(String) }));
		expect(fbtMock).toHaveBeenCalledWith('{count} min', null, expect.objectContaining({ params: { count: minutes }, hk: expect.any(String) }));
	});

	it('should format duration with 1 hour and 0 minutes (displays as 1 h)', () => {
		const hours = 1;
		expect(formatDurationAbbreviated(3600)).toBe('1 h');
		expect(fbtMock).toHaveBeenCalledWith('{count} h', null, expect.objectContaining({ params: { count: hours }, hk: expect.any(String) }));
	});

	it('should format duration with 0 hours and 1 minute (displays as 1 min)', () => {
		const minutes = 1;
		expect(formatDurationAbbreviated(60)).toBe('1 min');
		expect(fbtMock).toHaveBeenCalledWith('{count} min', null, expect.objectContaining({ params: { count: minutes }, hk: expect.any(String) }));
	});
});
