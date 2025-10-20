import { proxy } from 'valtio';
import { FeedingSession } from '@/types/feeding';

export const feedingSessions = proxy<FeedingSession[]>([]);
