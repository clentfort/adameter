import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const growthFormSchema = z
	.object({
		date: z.string().min(1),
		headCircumference: z.string(),
		height: z.string(),
		notes: z.string(),
		weight: z.string(),
	})
	.refine(
		(values) =>
			values.weight.length > 0 ||
			values.height.length > 0 ||
			values.headCircumference.length > 0,
		{
			message: 'Please enter at least a weight, height, or head circumference.',
			path: ['weight'],
		},
	);

export type GrowthFormValues = z.infer<typeof growthFormSchema>;

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
