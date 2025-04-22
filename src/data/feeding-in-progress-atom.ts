import { atomWithStorage } from 'jotai/utils';
import { FeedingInProgress } from '@/types/feeding-in-progress';

export const feedingInProgress = atomWithStorage<FeedingInProgress | undefined>(
	'feedingInProgress',
	undefined,
	undefined,
	{
		getOnInit: true,
	},
);
