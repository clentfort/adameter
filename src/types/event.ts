import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const eventFormSchema = z.object({
	color: z.string().min(1),
	description: z.string(),
	endDate: z.string(),
	endTime: z.string(),
	hasEndDate: z.boolean(),
	startDate: z.string().min(1),
	startTime: z.string().min(1),
	title: z.string().min(1),
	type: z.enum(['point', 'period']),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const eventSchema = z.object({
	color: z.string().optional(),
	description: z.string().optional(),
	deviceId: z.string().optional(),
	endDate: z.string().optional(),
	id: z.string(),
	startDate: z.string(),
	title: z.string(),
	type: z.enum(['point', 'period']),
});

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
