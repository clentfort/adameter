import { useLatestFeedingSessionRecord } from '@/hooks/use-feeding-sessions';

export function useNextBreast() {
	const latestFeedingSession = useLatestFeedingSessionRecord();

	return (latestFeedingSession?.breast ?? 'right') === 'left'
		? 'right'
		: 'left';
}
