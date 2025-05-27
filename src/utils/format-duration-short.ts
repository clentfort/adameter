import { Duration } from 'date-fns';

/**
 * Formats a duration object into a string in the format "MM:SS",
 * assuming Intl.DurationFormat is available (Node.js 22+).
 */
export function formatDurationShort(duration: Duration): string {
	// Intl.DurationFormat expects years, months, weeks, days, hours, minutes, seconds.
	// The input 'duration' (from date-fns) might not have all of these; default undefined parts to 0.
	const {
		years = 0,
		months = 0,
		weeks = 0,
		days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0,
	} = duration;

	// Using 'en' locale as a neutral base for consistent parsing of parts.
	// The output format "MM:SS" is locale-agnostic.
	// Requesting numeric for all relevant parts.
	const df = new Intl.DurationFormat('en', {
		years: 'numeric',
		months: 'numeric',
		weeks: 'numeric',
		days: 'numeric',
		hours: 'numeric',
		minutes: 'numeric',
		seconds: 'numeric',
	});

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

	const parts = df.formatToParts(intlDuration);

	let extractedHours = 0;
	let extractedMinutes = 0;
	let extractedSeconds = 0;

	for (const part of parts) {
		if (part.type === 'hours') {
			// Ensure value is treated as a number, default to 0 if parsing fails
			extractedHours = parseInt(part.value, 10);
			if (isNaN(extractedHours)) extractedHours = 0;
		} else if (part.type === 'minutes') {
			extractedMinutes = parseInt(part.value, 10);
			if (isNaN(extractedMinutes)) extractedMinutes = 0;
		} else if (part.type === 'seconds') {
			extractedSeconds = parseInt(part.value, 10);
			if (isNaN(extractedSeconds)) extractedSeconds = 0;
		}
		// We ignore years, months, weeks, days for the "MM:SS" format
	}

	// Calculate total minutes as per the "MM:SS" requirement
	const totalMinutes = extractedHours * 60 + extractedMinutes;

	// Format to "MM:SS"
	const minutesAsString = String(totalMinutes).padStart(2, '0');
	const secondsAsString = String(extractedSeconds).padStart(2, '0');

	return `${minutesAsString}:${secondsAsString}`;
}
