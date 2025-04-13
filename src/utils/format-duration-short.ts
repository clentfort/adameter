import { Duration } from 'date-fns';

/**
 * Formats a duration object into a string in the format "MM:SS".
 */
export function formatDurationShort(duration: Duration): string {
	const hours = duration.hours ?? 0;
	const minutes = hours * 60 + (duration.minutes ?? 0);
	const seconds = duration.seconds ?? 0;

	const minutesAsString = String(minutes).padStart(2, '0');
	const secondsAsString = String(seconds).padStart(2, '0');

	return `${minutesAsString}:${secondsAsString}`;
}
