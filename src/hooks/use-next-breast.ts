import { useFeedingSessions } from './use-feeding-sessions';

export const useNextBreast = () => {
	const { value: sessions } = useFeedingSessions();
	const latestBreastFeedingSession = sessions
		.filter((s) => s.breast !== 'bottle')
		.sort(
			(a, b) =>
				new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
		)[0];

	return (latestBreastFeedingSession?.breast ?? 'right') === 'left'
		? 'right'
		: 'left';
};
