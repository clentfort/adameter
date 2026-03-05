import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const growthFormSchema = z
	.object({
		date: z.string().min(1),
		headCircumference: z
			.string()
			.refine(
				(v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) > 0),
				'Must be a positive number',
			),
		height: z
			.string()
			.refine(
				(v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) > 0),
				'Must be a positive number',
			),
		notes: z.string(),
		weight: z
			.string()
			.refine(
				(v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) > 0),
				'Must be a positive number',
			),
	})
	.refine(
		(values) =>
			values.weight.length > 0 ||
			values.height.length > 0 ||
			values.headCircumference.length > 0,
		{
			message: 'AT_LEAST_ONE_REQUIRED',
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
