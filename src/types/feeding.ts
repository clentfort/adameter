import { z } from 'zod';
import type { BaseEntity } from './base-entity';

export const feedingSchema = z.object({
	breast: z.enum(['left', 'right']),
	date: z.string().min(1),
	duration: z.string().min(1).refine((val) => !Number.isNaN(Number(val)), {
		message: 'Must be a number',
	}),
	time: z.string().min(1),
});

export type FeedingFormValues = z.infer<typeof feedingSchema>;

export interface FeedingSession extends BaseEntity {
	breast: 'left' | 'right';
	durationInSeconds: number;
	endTime: string;
	startTime: string;
}
