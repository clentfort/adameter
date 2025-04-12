import {
	daysToWeeks,
	Duration,
	formatDuration,
	intervalToDuration,
	LocalizedOptions,
} from 'date-fns';
import { fbt } from 'fbtee';

const units: ReadonlyArray<keyof Duration> = [
	'weeks',
	'days',
	'hours',
	'minutes',
];

export function formatSince(
	since: number | Date,
	{ locale }: LocalizedOptions<'formatDistance'> = {},
) {
	const sinceAsNumber = typeof since === 'number' ? since : since.getTime();
	const duration = intervalToDuration({
		end: new Date(),
		start: sinceAsNumber,
	});
	duration.weeks = daysToWeeks(duration.days ?? 0);
	for (const label of units) {
		if (duration[label] && duration[label] > 0) {
			return fbt(
				fbt.param(
					'value',
					formatDuration(duration, {
						format: [label],
						locale,
					}),
				) + ' ago',
				'Label indicating that something happened a specific time ago',
			);
		}
	}

	return fbt('Just now', 'Label indicating that something happend just now');
}
