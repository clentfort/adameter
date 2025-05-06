import { useFeedingSessions } from './use-feeding-sessions';

export const useNextBreast = () => {
	const { value: feedingSessions } = useFeedingSessions();
	return (feedingSessions[0]?.breast ?? 'right') === 'left' ? 'right' : 'left';
};
