import { z } from 'zod';

export const feedingInProgressSchema = z.object({
	breast: z.enum(['left', 'right']),
	profileId: z.string().optional(),
	startTime: z.string().min(1),
});

export interface FeedingInProgress {
	breast: 'left' | 'right';
	profileId?: string;
	startTime: string;
}
