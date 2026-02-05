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

		// Sort by timestamp in descending order and take the first element
		// Timestamps are ISO strings, so string comparison works for finding the latest.
		const latestChange = [...diaperChanges].sort((a, b) => {
			if (a.timestamp < b.timestamp) {
				return 1;
			}
			if (a.timestamp > b.timestamp) {
				return -1;
			}
			return 0;
		})[0];

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
