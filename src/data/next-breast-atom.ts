import { atom } from 'jotai/vanilla';
import { feedingsAtom } from './feedings-atom';

export const nextBreastAtom = atom((get) => {
	const feedingSessions = get(feedingsAtom);
	const latestFeedingSession = feedingSessions[0];
	return latestFeedingSession?.breast === 'left' ? 'right' : 'left';
});
