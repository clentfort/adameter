import type { Duration } from 'date-fns';

/**
 * Formats a duration object into a locale-sensitive string,
 * assuming Intl.DurationFormat is available (Node.js 22+).
 */
export function formatDurationLocale(duration: Duration): string {
	// Intl.DurationFormat expects a duration object with all relevant parts.
	// The input `date-fns` Duration might only have some parts.
	// Defaulting undefined parts to 0 is important.
	const {
		years = 0,
		months = 0,
		weeks = 0,
		days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0,
	} = duration;

	// Create a duration object suitable for Intl.DurationFormat
	const intlDuration = {
		years,
		months,
		weeks,
		days,
		hours,
		minutes,
		seconds,
	};

	// Use user's default locale (undefined) and 'short' style.
	const formatter = new Intl.DurationFormat(undefined, {
		style: 'short',
		// As per MDN, unit display options (e.g., hour: 'numeric') are generally
		// ignored when a 'style' (short, long, narrow) is specified.
		// The 'style' itself dictates which units are shown and their format.
	});

	return formatter.format(intlDuration);
}
