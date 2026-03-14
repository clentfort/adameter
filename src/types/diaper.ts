import type { BaseEntity } from './base-entity';
import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import {
	numericInputField,
	optionalBooleanCell,
	optionalNumberCell,
	optionalNumberFromInputField,
	optionalStringCell,
	requiredBooleanField,
	requiredNameField,
} from './schema-utils';

const diaperProductSharedSchema = z.object({
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
	notes: z.string().optional(),
	pottyStool: requiredBooleanField,
	pottyUrine: requiredBooleanField,
	temperature: numericInputField('Temperature must be a number'),
	time: z.string().min(1),
});

export type DiaperFormValues = z.infer<typeof diaperFormSchema>;

export const diaperFormToDataSchema = diaperFormSchema.transform((values) => {
	const [year, month, day] = values.date.split('-').map(Number);
	const [hours, minutes] = values.time.split(':').map(Number);
	const timestamp = new Date(year, month - 1, day, hours, minutes);

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

export interface DiaperProduct extends BaseEntity {
	/** Whether the product is archived. */
	archived?: boolean;
	/** Cost per diaper in the current currency. */
	costPerDiaper?: number;
	/** Whether the diaper is reusable. */
	isReusable: boolean;
	/** Name of the diaper product. */
	name: string;
	/** One-time upfront cost for reusable diapers in the current currency. */
	upfrontCost?: number;
}

export interface DiaperChange extends BaseEntity {
	/** Whether the diaper contains stool. */
	containsStool: boolean;
	/** Whether the diaper contains urine. */
	containsUrine: boolean;
	/** Optional diaper brand (deprecated, use diaperProductId). */
	diaperBrand?: string;
	/** Reference to the diaper product used. */
	diaperProductId?: string;
	/** Optional leakage indicator. */
	leakage?: boolean;
	/** Whether stool went into the potty. */
	pottyStool?: boolean;
	/** Whether urine went into the potty. */
	pottyUrine?: boolean;
	/** Optional temperature in Celsius. */
	temperature?: number;
	/** Timestamp of the diaper change. */
	timestamp: string;
}
