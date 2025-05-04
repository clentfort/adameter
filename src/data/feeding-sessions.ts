import { proxy } from 'valtio';
import { FeedingSession } from '@/types/feeding';
import { Encrypted } from '@/utils/crypto';

export const feedingSessions = proxy(
	[] as unknown as Encrypted<FeedingSession[]>,
);
