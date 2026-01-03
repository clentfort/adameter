import { FeedingSession } from '@/types/feeding';
import { useArrayState } from './use-array-state';

export const useFeedingSessions = () =>
	useArrayState<FeedingSession>('feeding-sessions');
