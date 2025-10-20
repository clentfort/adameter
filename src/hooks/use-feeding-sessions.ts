import { feedingSessions } from '@/data/feeding-sessions';
import { useArrayState } from './use-array-state';

export const useFeedingSessions = () =>
	useArrayState(feedingSessions, 'feedingSessions-backup');
