import { useLatestFeedingSession } from './use-latest-feeding-session';

export const useNextBreast = () => {
	const latestFeedingSession = useLatestFeedingSession();
	return (latestFeedingSession?.breast ?? 'right') === 'left'
		? 'right'
		: 'left';
};
