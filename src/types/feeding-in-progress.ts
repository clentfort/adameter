import { z } from 'zod';
import { baseEntitySchema } from './base-entity';

export const feedingInProgressSchema = baseEntitySchema.extend({
	breast: z.enum(['left', 'right']).optional(),
	startTime: z.string().min(1),
	type: z.enum(['breast', 'bottle']).default('breast'),
});

export type FeedingInProgress = z.infer<typeof feedingInProgressSchema>;
