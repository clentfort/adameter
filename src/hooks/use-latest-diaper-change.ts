import { useMemo } from 'react';
import { logPerformanceEvent } from '@/lib/performance-logging';
import { DiaperChange } from '@/types/diaper';
import { useDiaperChanges } from './use-diaper-changes';

export function useLatestDiaperChange(): DiaperChange | undefined {
	const { value: diaperChanges } = useDiaperChanges();

	return useMemo(() => {
		const start =
			typeof performance !== 'undefined' ? performance.now() : Date.now();

		if (!diaperChanges || diaperChanges.length === 0) {
			return undefined;
		}

		let latestChange = diaperChanges[0];
		for (let index = 1; index < diaperChanges.length; index += 1) {
			const diaperChange = diaperChanges[index];
			if (diaperChange.timestamp > latestChange.timestamp) {
				latestChange = diaperChange;
			}
		}

		const durationMs =
			(typeof performance !== 'undefined' ? performance.now() : Date.now()) -
			start;

		if (diaperChanges.length >= 200 || durationMs >= 3) {
			logPerformanceEvent(
				'ui.latest-diaper.compute',
				{
					durationMs,
					metadata: {
						itemCount: diaperChanges.length,
					},
				},
				{ throttleKey: 'ui.latest-diaper.compute', throttleMs: 4000 },
			);
		}

		return latestChange;
	}, [diaperChanges]);
}
