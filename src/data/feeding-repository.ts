import { FeedingSession } from '@/types/feeding';
import { Repository } from './repository';

export const feedingRepository = new Repository<FeedingSession>(
	'feedingSessions',
);
