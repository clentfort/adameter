import { proxy } from 'valtio';
import { FeedingInProgress } from '@/types/feeding-in-progress';

export const feedingInProgress: {
	current: FeedingInProgress | null;
} = proxy({ current: null });
