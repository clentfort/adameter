import { atomWithStorage } from 'jotai/utils';
import { FeedingSession } from '@/types/feeding';

export const feedingsAtom = atomWithStorage<FeedingSession[]>(
	'feedingSessions',
	[],
	undefined,
	{
		getOnInit: true,
	},
);
