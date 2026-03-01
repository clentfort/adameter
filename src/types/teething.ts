import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const teethingFormSchema = z.object({
	date: z.string().min(1),
	notes: z.string(),
});

export type TeethingFormValues = z.infer<typeof teethingFormSchema>;

export interface Tooth extends BaseEntity {
	date?: string; // ISO date of eruption
	notes?: string;
	toothId: number; // FDI number
}
