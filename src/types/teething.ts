import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import { integerCell, optionalStringCell } from './schema-utils';

const teethingSharedSchema = z.object({
	date: optionalStringCell, // ISO date of eruption
	notes: optionalStringCell,
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
	toothId: integerCell, // FDI number
});

export const toothSchema = baseEntitySchema.extend(toothDataSchema.shape);

export type ToothData = z.infer<typeof toothDataSchema>;
export type TeethingFormData = z.infer<typeof teethingFormToDataSchema>;

export function parseTeethingFormValues(
	values: TeethingFormValues,
): TeethingFormData {
	return teethingFormToDataSchema.parse(values);
}

export type Tooth = z.infer<typeof toothSchema>;
