import { z } from 'zod';
import type { BaseEntity } from './base-entity';

export const growthSchema = z
	.object({
		date: z.string().min(1),
		headCircumference: z.string().optional(),
		height: z.string().optional(),
		notes: z.string().optional(),
		weight: z.string().optional(),
	})
	.refine((data) => data.weight || data.height || data.headCircumference, {
		message: 'At least one measurement is required',
		path: ['weight'], // Path to show error on if needed
	});

export type GrowthFormValues = z.infer<typeof growthSchema>;

export interface GrowthMeasurement extends BaseEntity {
	// ISO string
	date: string;
	// in centimeters
	headCircumference?: number;
	// in centimeters
	height?: number;
	notes?: string;
	// in grams
	weight?: number;
}
