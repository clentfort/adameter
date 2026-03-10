import type { BaseEntity } from './base-entity';
import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import {
	optionalPositiveNumberCell,
	optionalPositiveNumberFromInputField,
	optionalTextField,
} from './schema-utils';

const growthMeasurementSharedSchema = z
	.object({
		date: z.string().min(1),
		headCircumference: optionalPositiveNumberCell,
		height: optionalPositiveNumberCell,
		notes: optionalTextField,
		weight: optionalPositiveNumberCell,
	})
	.refine(
		(values) =>
			values.weight !== undefined ||
			values.height !== undefined ||
			values.headCircumference !== undefined,
		{
			message: 'AT_LEAST_ONE_REQUIRED',
			path: ['weight'],
		},
	);

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

export const growthFormToDataSchema = growthFormSchema.transform((values) =>
	growthMeasurementSharedSchema.parse({
		date: new Date(`${values.date}T12:00:00`).toISOString(),
		headCircumference: optionalPositiveNumberFromInputField(
			'Must be a positive number',
		).parse(values.headCircumference),
		height: optionalPositiveNumberFromInputField(
			'Must be a positive number',
		).parse(values.height),
		notes: values.notes,
		weight: optionalPositiveNumberFromInputField(
			'Must be a positive number',
		).parse(values.weight),
	}),
);

export const growthMeasurementDataSchema = growthMeasurementSharedSchema;

export const growthMeasurementSchema = baseEntitySchema.extend(
	growthMeasurementDataSchema.shape,
);

export type GrowthMeasurementData = z.infer<typeof growthMeasurementDataSchema>;
export type GrowthFormData = z.infer<typeof growthFormToDataSchema>;

export function parseGrowthFormValues(
	values: GrowthFormValues,
): GrowthFormData {
	return growthFormToDataSchema.parse(values);
}

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
