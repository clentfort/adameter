import { fbt } from 'fbtee';

/**
 * Formats a duration in seconds into a string like "X h Y min".
 * Omits hours if the duration is less than an hour.
 * Omits minutes if the duration is less than a minute and hours are zero.
 *
 * @param totalSeconds The total duration in seconds.
 * @returns A formatted string representing the duration.
 */
export function formatDurationAbbreviated(totalSeconds: number): string {
	if (totalSeconds < 0) {
		totalSeconds = 0;
	}

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	const parts: string[] = [];

	if (hours > 0) {
		parts.push(
			fbt(
				`${hours} h`,
				'Abbreviated format for hours. Example: "1 h", "2 h". Use the "h" abbreviation for hour. The number of hours will be prepended.',
				{
					// Use `hour` as a common key for pluralization if needed, though here we are constructing the string directly.
					// For more complex pluralization, direct use of fbt.plural might be needed if this structure isn't sufficient.
				},
			).toString(),
		);
	}

	if (minutes > 0) {
		parts.push(
			fbt(
				`${minutes} min`,
				'Abbreviated format for minutes. Example: "1 min", "30 min". Use the "min" abbreviation for minute. The number of minutes will be prepended.',
				{
					// Use `minute` as a common key for pluralization if needed.
				},
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
