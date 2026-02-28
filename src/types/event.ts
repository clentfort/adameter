import { z } from 'zod';
import type { BaseEntity } from './base-entity';

export const eventSchema = z.object({
	color: z.string().optional(),
	description: z.string().optional(),
	endDate: z.string().optional(),
	endTime: z.string().optional(),
	hasEndDate: z.boolean(),
	startDate: z.string().min(1),
	startTime: z.string().min(1),
	title: z.string().min(1),
	type: z.enum(['point', 'period']),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export interface Event extends BaseEntity {
	// point = single date, period = start to end date
	color?: string;
	description?: string;
	// ISO string
	endDate?: string;
	startDate: string;
	title: string;
	// ISO string, optional for ongoing events
	type: 'point' | 'period'; // Optional color for the event
}
