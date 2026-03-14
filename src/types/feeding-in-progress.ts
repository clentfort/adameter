import { z } from 'zod';

export const feedingInProgressSchema = z.object({
	breast: z.enum(['left', 'right']),
	startTime: z.string().min(1),
});

export interface FeedingInProgress {
	breast: 'left' | 'right';
	startTime: string;
}
