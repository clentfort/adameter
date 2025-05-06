import { proxy } from 'valtio';
import { FeedingInProgress } from '@/types/feeding-in-progress';
import { Encrypted } from '@/utils/crypto';

export const feedingInProgress: {
	current: Encrypted<FeedingInProgress> | null;
} = proxy({ current: null });
