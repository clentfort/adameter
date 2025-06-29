import { fbt } from 'fbtee';

/**
 * Formats a duration in seconds into a string like "X h Y min".
 * Omits hours if the duration is less than an hour.
 * Omits minutes if the duration is less than a minute and hours are zero.
 *
 * @param duration The total duration in seconds.
 * @returns A formatted string representing the duration.
 */
export function formatDurationAbbreviated(duration: number): string {
	duration = Math.max(0, duration);

	const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);

	const parts: string[] = [];

	if (hours > 0) {
		parts.push(
			fbt(
				`${fbt.param('hours', hours)} h`,
				'Abbreviated format for hours. Example: "1 h", "2 h". Use the "h" abbreviation for hour. [count] will be replaced by the number of hours.',
			).toString(),
		);
	}

	if (minutes > 0) {
		parts.push(
			fbt(
				`${fbt.param('count', minutes)} min`,
				'Abbreviated format for minutes. Example: "1 min", "30 min". Use the "min" abbreviation for minute. [count] will be replaced by the number of minutes.',
			).toString(),
		);
	}

	if (hours === 0 && minutes === 0) {
		return fbt(
			'0 min',
			'Abbreviated format for zero minutes. "min" is the abbreviation for minute.',
		).toString();
	}

	return parts.join(' ').trim();
}
