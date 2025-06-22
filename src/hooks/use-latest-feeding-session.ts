import { useMemo } from 'react';
import { FeedingSession } from '@/types/feeding';
import { useFeedingSessions } from './use-feeding-sessions';

export function useLatestFeedingSession(): FeedingSession | undefined {
	const { value: feedingSessions } = useFeedingSessions();

	return useMemo(() => {
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

		return sortedSessions[0];
	}, [feedingSessions]);
}
