import { useMemo } from 'react';
import { logPerformanceEvent } from '@/lib/performance-logging';
import { FeedingSession } from '@/types/feeding';
import { useFeedingSessions } from './use-feeding-sessions';

export function useLatestFeedingSession(): FeedingSession | undefined {
	const { value: feedingSessions } = useFeedingSessions();

	return useMemo(() => {
		const start =
			typeof performance !== 'undefined' ? performance.now() : Date.now();

		if (!feedingSessions || feedingSessions.length === 0) {
			return undefined;
		}

		// Create a shallow copy before sorting
		const sortedSessions = [...feedingSessions].sort((a, b) => {
			// Compare endTime strings directly (ISO format ensures correct chronological sorting)
			if (a.endTime < b.endTime) {
				return 1; // b is later
			}
			if (a.endTime > b.endTime) {
				return -1; // a is later
			}
			return 0;
		});

		const latestSession = sortedSessions[0];
		const durationMs =
			(typeof performance !== 'undefined' ? performance.now() : Date.now()) -
			start;

		if (feedingSessions.length >= 200 || durationMs >= 3) {
			logPerformanceEvent(
				'ui.latest-feeding.compute',
				{
					durationMs,
					metadata: {
						itemCount: feedingSessions.length,
					},
				},
				{ throttleKey: 'ui.latest-feeding.compute', throttleMs: 4000 },
			);
		}

		return latestSession;
	}, [feedingSessions]);
}
