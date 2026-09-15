import { z } from 'zod';

export const feedingInProgressSchema = z.object({
	breast: z.enum(['left', 'right']),
	id: z.string().optional(),
	profileId: z.string().optional(),
	startTime: z.string().min(1),
});

export interface FeedingInProgress {
	breast: 'left' | 'right';
	id?: string;
	profileId?: string;
	startTime: string;
}
