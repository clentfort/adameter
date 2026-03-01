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

		let latestSession = feedingSessions[0];
		for (let index = 1; index < feedingSessions.length; index += 1) {
			const session = feedingSessions[index];
			if (session.endTime > latestSession.endTime) {
				latestSession = session;
			}
		}

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
