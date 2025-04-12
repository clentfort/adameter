import { describe, expect, it } from 'vitest';
import { formatSince } from './format-since';

describe('formatSince', () => {
	it('only shows the largest unit', () => {
		// Weeks
		expect(formatSince(Date.now() - 14 * 24 * 60 * 60 * 1000)).toBe(
			'2 weeks ago',
		);
		expect(formatSince(Date.now() - 7 * 24 * 60 * 60 * 1000)).toBe(
			'1 week ago',
		);

		// Days
		expect(formatSince(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe(
			'2 days ago',
		);
		expect(formatSince(Date.now() - 1 * 24 * 60 * 60 * 1000)).toBe('1 day ago');

		// Hours
		expect(formatSince(Date.now() - 2 * 60 * 60 * 1000)).toBe('2 hours ago');
		expect(formatSince(Date.now() - 60 * 60 * 1000)).toBe('1 hour ago');

		// Minutes
		expect(formatSince(Date.now() - 2 * 60 * 1000)).toBe('2 minutes ago');
		expect(formatSince(Date.now() - 1 * 60 * 1000)).toBe('1 minute ago');

		// Seconds
		expect(formatSince(Date.now() - 2 * 1000)).toBe('Just now');
	});
});
