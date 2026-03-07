import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const teethingFormSchema = z.object({
	date: z.string().min(1),
	notes: z.string(),
});

export type TeethingFormValues = z.infer<typeof teethingFormSchema>;

export const toothSchema = z.object({
	date: z.string().optional(),
	deviceId: z.string().optional(),
	id: z.string(),
	notes: z.string().optional(),
	toothId: z.number(),
});

export interface Tooth extends BaseEntity {
	date?: string; // ISO date of eruption
	notes?: string;
	toothId: number; // FDI number
}
