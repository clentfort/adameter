import { z } from 'zod';
import type { BaseEntity } from './base-entity';

export const teethingSchema = z.object({
	date: z.string().min(1),
	notes: z.string().optional(),
});

export type TeethingFormValues = z.infer<typeof teethingSchema>;

export interface Tooth extends BaseEntity {
	date?: string; // ISO date of eruption
	notes?: string;
	toothId: number; // FDI number
}
