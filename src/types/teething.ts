import { z } from 'zod';
import { baseEntitySchema, type BaseEntity } from './base-entity';
import {
	integerCell,
	optionalStringCell,
	optionalTextField,
} from './schema-utils';

const teethingSharedSchema = z.object({
	date: optionalStringCell,
	notes: optionalTextField,
});

export const teethingFormSchema = z.object({
	date: z.string().min(1),
	notes: z.string(),
});

export type TeethingFormValues = z.infer<typeof teethingFormSchema>;

export const teethingFormToDataSchema = teethingFormSchema.transform((values) =>
	teethingSharedSchema.parse({
		date: new Date(`${values.date}T12:00:00`).toISOString(),
		notes: values.notes,
	}),
);

export const toothDataSchema = teethingSharedSchema.extend({
	toothId: integerCell,
});

export const toothSchema = baseEntitySchema.extend(toothDataSchema.shape);

export type ToothData = z.infer<typeof toothDataSchema>;
export type TeethingFormData = z.infer<typeof teethingFormToDataSchema>;

export function parseTeethingFormValues(
	values: TeethingFormValues,
): TeethingFormData {
	return teethingFormToDataSchema.parse(values);
}

export interface Tooth extends BaseEntity {
	date?: string; // ISO date of eruption
	notes?: string;
	toothId: number; // FDI number
}
