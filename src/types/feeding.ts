import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const feedingFormSchema = z.object({
	breast: z.enum(['left', 'right']),
	date: z.string().min(1),
	duration: z
		.string()
		.min(1)
		.refine((value) => !Number.isNaN(Number(value)), {
			message: 'Duration must be a number',
		}),
	time: z.string().min(1),
});

export type FeedingFormValues = z.infer<typeof feedingFormSchema>;

export const feedingSessionSchema = z.object({
	breast: z.enum(['left', 'right']),
	deviceId: z.string().optional(),
	durationInSeconds: z.number(),
	endTime: z.string(),
	id: z.string(),
	startTime: z.string(),
});

export interface FeedingSession extends BaseEntity {
	breast: 'left' | 'right';
	durationInSeconds: number;
	endTime: string;
	startTime: string;
}
