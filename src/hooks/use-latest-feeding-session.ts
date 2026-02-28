import { useMemo } from 'react';
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

		return latestSession;
	}, [feedingSessions]);
}
