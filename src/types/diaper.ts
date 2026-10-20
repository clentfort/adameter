import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import {
	combineLocalDateAndTime,
	locationFormFields,
	numericInputField,
	optionalBooleanCell,
	optionalNumberCell,
	optionalNumberFromInputField,
	optionalStringCell,
	parseLocationFormFields,
	requiredBooleanField,
	requiredNameField,
} from './schema-utils';

const diaperProductSharedSchema = z.object({
	color: optionalStringCell,
	costPerDiaper: optionalNumberCell,
	isReusable: requiredBooleanField,
	name: requiredNameField,
	notes: optionalStringCell,
	upfrontCost: optionalNumberCell,
});

const diaperChangeSharedSchema = z.object({
	containsStool: requiredBooleanField,
	containsUrine: requiredBooleanField,
	diaperProductId: optionalStringCell,
	leakage: optionalBooleanCell,
	locationLatitude: optionalNumberCell,
	locationLongitude: optionalNumberCell,
	notes: optionalStringCell,
	pottyStool: optionalBooleanCell,
	pottyUrine: optionalBooleanCell,
	temperature: optionalNumberCell,
});

export const diaperFormSchema = z.object({
	containsStool: requiredBooleanField,
	containsUrine: requiredBooleanField,
	date: z.string().min(1),
	diaperProductId: z.string().optional(),
	leakage: requiredBooleanField,
	...locationFormFields,
	notes: z.string().optional(),
	pottyStool: requiredBooleanField,
	pottyUrine: requiredBooleanField,
	temperature: numericInputField('Temperature must be a number'),
	time: z.string().min(1),
});

export type DiaperFormValues = z.infer<typeof diaperFormSchema>;

export const diaperFormToDataSchema = diaperFormSchema.transform((values) => {
	const timestamp = combineLocalDateAndTime(values.date, values.time);

	return diaperChangeSharedSchema
		.extend({
			diaperBrand: optionalStringCell,
			timestamp: z.string().min(1),
		})
		.parse({
			containsStool: values.containsStool,
			containsUrine: values.containsUrine,
			diaperProductId: values.diaperProductId,
			leakage: values.leakage ? true : undefined,
			...parseLocationFormFields(values),
			notes: values.notes,
			pottyStool: values.pottyStool,
			pottyUrine: values.pottyUrine,
			temperature: optionalNumberFromInputField(
				'Temperature must be a number',
			).parse(values.temperature),
			timestamp: timestamp.toISOString(),
		});
});

export const diaperProductFormSchema = z.object({
	color: z.string().optional(),
	costPerDiaper: numericInputField('Cost per diaper must be a number'),
	isReusable: requiredBooleanField,
	name: requiredNameField,
	notes: z.string().optional(),
	upfrontCost: numericInputField('Upfront cost must be a number'),
});

export type DiaperProductFormValues = z.infer<typeof diaperProductFormSchema>;

export const diaperProductFormToDataSchema = diaperProductFormSchema.transform(
	(values) =>
		diaperProductSharedSchema.parse({
			color: values.color,
			costPerDiaper: optionalNumberFromInputField(
				'Cost per diaper must be a number',
			).parse(values.costPerDiaper),
			isReusable: values.isReusable,
			name: values.name,
			notes: values.notes,
			upfrontCost: values.isReusable
				? optionalNumberFromInputField('Upfront cost must be a number').parse(
						values.upfrontCost,
					)
				: undefined,
		}),
);

export const diaperProductDataSchema = diaperProductSharedSchema.extend({
	archived: optionalBooleanCell,
});

export const diaperProductSchema = baseEntitySchema.extend(
	diaperProductDataSchema.shape,
);

export const diaperChangeDataSchema = diaperChangeSharedSchema.extend({
	diaperBrand: optionalStringCell,
	timestamp: z.string().min(1),
});

export const diaperChangeSchema = baseEntitySchema.extend(
	diaperChangeDataSchema.shape,
);

export type DiaperProductData = z.infer<typeof diaperProductDataSchema>;
export type DiaperChangeData = z.infer<typeof diaperChangeDataSchema>;
export type DiaperProductFormData = z.infer<
	typeof diaperProductFormToDataSchema
>;
export type DiaperFormData = z.infer<typeof diaperFormToDataSchema>;

export function parseDiaperProductFormValues(
	values: DiaperProductFormValues,
): DiaperProductFormData {
	return diaperProductFormToDataSchema.parse(values);
}

export function parseDiaperFormValues(
	values: DiaperFormValues,
): DiaperFormData {
	return diaperFormToDataSchema.parse(values);
}

export type DiaperProduct = z.infer<typeof diaperProductSchema>;
export type DiaperChange = z.infer<typeof diaperChangeSchema>;
