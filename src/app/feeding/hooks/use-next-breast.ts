import { useLatestFeedingSessionRecord } from '@/hooks/use-feeding-sessions';

export function useNextBreast() {
	const latestFeedingSession = useLatestFeedingSessionRecord();

	if (latestFeedingSession?.type !== 'breast') {
		return 'left';
	}

	return latestFeedingSession.breast === 'left' ? 'right' : 'left';
}
