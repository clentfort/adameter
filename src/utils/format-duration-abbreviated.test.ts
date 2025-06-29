import { formatDurationAbbreviated } from './format-duration-abbreviated';
import { setLocale, DEFAULT_LOCALE } from '@/i18n'; // Assuming setLocale can be used this way for tests

// Mock fbtee's fbt function for testing purposes
jest.mock('fbtee', () => ({
	fbt: jest.fn((text, _description, _options) => text.toString()),
}));

describe('formatDurationAbbreviated', () => {
	beforeEach(async () => {
		// Reset to default locale before each test if necessary
		// This assumes setLocale can work in a test environment.
		// If fbtee relies on browser context (localStorage, navigator), this might need more complex mocking.
		await setLocale(DEFAULT_LOCALE);
		// Clear mock call counts before each test
		(require('fbtee').fbt as jest.Mock).mockClear();
	});

	it('should format duration with hours and minutes', () => {
		// 3 hours, 45 minutes = (3 * 3600) + (45 * 60) = 10800 + 2700 = 13500 seconds
		expect(formatDurationAbbreviated(13500)).toBe('3 h 45 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'3 h',
			expect.any(String),
			expect.any(Object),
		);
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'45 min',
			expect.any(String),
			expect.any(Object),
		);
	});

	it('should format duration with only hours (exact hours)', () => {
		// 2 hours = 2 * 3600 = 7200 seconds
		expect(formatDurationAbbreviated(7200)).toBe('2 h');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'2 h',
			expect.any(String),
			expect.any(Object),
		);
	});

	it('should format duration with only minutes', () => {
		// 30 minutes = 30 * 60 = 1800 seconds
		expect(formatDurationAbbreviated(1800)).toBe('30 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'30 min',
			expect.any(String),
			expect.any(Object),
		);
	});

	it('should format duration less than a minute as 0 min', () => {
		// 45 seconds
		expect(formatDurationAbbreviated(45)).toBe('0 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'0 min',
			expect.any(String), // Description for "0 min"
		);
	});

	it('should format zero seconds as 0 min', () => {
		expect(formatDurationAbbreviated(0)).toBe('0 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'0 min',
			expect.any(String), // Description for "0 min"
		);
	});

	it('should handle negative numbers by treating them as 0', () => {
		expect(formatDurationAbbreviated(-100)).toBe('0 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'0 min',
			expect.any(String),
		);
	});

	it('should format duration with 1 hour and 1 minute', () => {
		// 1 hour, 1 minute = 3600 + 60 = 3660 seconds
		expect(formatDurationAbbreviated(3660)).toBe('1 h 1 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'1 h',
			expect.any(String),
			expect.any(Object),
		);
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'1 min',
			expect.any(String),
			expect.any(Object),
		);
	});

	it('should format duration with 1 hour and 0 minutes (displays as 1 h)', () => {
		// This case is handled by the "exact hours" logic
		expect(formatDurationAbbreviated(3600)).toBe('1 h');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'1 h',
			expect.any(String),
			expect.any(Object),
		);
	});

	it('should format duration with 0 hours and 1 minute (displays as 1 min)', () => {
		expect(formatDurationAbbreviated(60)).toBe('1 min');
		expect(require('fbtee').fbt).toHaveBeenCalledWith(
			'1 min',
			expect.any(String),
			expect.any(Object),
		);
	});

	// Example of how one might try to test different locales if fbtee's internals allow.
	// This is highly dependent on fbtee's implementation and how translations are loaded/mocked.
	// For this example, we'll assume `fbt` simply returns the key if no translation is found,
	// or the mock is adjusted to simulate translation.
	// A more robust approach would involve mocking the translation loading mechanism of fbtee.

	// it('should attempt to use different locale strings (conceptual test)', async () => {
	// 	// Mock fbt to return a modified string for a different "locale"
	// 	const fbtMock = require('fbtee').fbt as jest.Mock;
	// 	fbtMock.mockImplementation((text, description) => {
	// 		if (text === '1 h' && description.includes('Abbreviated format for hours')) {
	// 			return '1 Std'; // German abbreviation for hour
	// 		}
	// 		if (text === '5 min' && description.includes('Abbreviated format for minutes')) {
	// 			return '5 Min.'; // German abbreviation for minutes
	// 		}
	// 		return text;
	// 	});

	// 	// This test doesn't actually change the locale in a way fbtee would recognize
	// 	// without deeper integration or specific mocking of fbtee's locale handling.
	// 	// It primarily tests that the correct fbt calls are made.
	// 	// await setLocale('de_DE'); // This might not have an effect on the mock above

	// 	expect(formatDurationAbbreviated(3900)).toBe('1 Std 5 Min.'); // 1 hour 5 minutes
	// });
});
