import { describe, expect, it } from 'vitest';
import { getDaySpan } from './day-span';

describe('getDaySpan', () => {
	it('returns 0 when given an empty array', () => {
		expect(getDaySpan([])).toBe(0);
	});

	it('returns 1 for a single timestamp', () => {
		expect(getDaySpan(['2026-03-01T12:00:00Z'])).toBe(1);
	});

	it('returns 1 for multiple timestamps on the same day', () => {
		expect(getDaySpan(['2026-03-01T08:00:00Z', '2026-03-01T20:00:00Z'])).toBe(
			1,
		);
	});

	it('returns correct day span across multiple days', () => {
		expect(getDaySpan(['2026-03-01T10:00:00Z', '2026-03-03T10:00:00Z'])).toBe(
			3,
		);
	});

	it('handles mixed timestamp types (strings, Date objects, epoch numbers)', () => {
		const date1 = '2026-03-01T10:00:00Z';
		const date2 = new Date('2026-03-02T10:00:00Z');
		const date3 = new Date('2026-03-04T10:00:00Z').getTime();

		expect(getDaySpan([date1, date2, date3])).toBe(4);
	});
});
