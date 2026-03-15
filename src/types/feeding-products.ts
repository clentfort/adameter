import type { BaseEntity } from './base-entity';
import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import {
	optionalBooleanCell,
	optionalNumberCell,
	optionalNumberFromInputField,
	optionalStringCell,
	requiredNameField,
} from './schema-utils';

// Formula Products
export const formulaProductDataSchema = z.object({
	archived: optionalBooleanCell,
	costPerMl: optionalNumberCell,
	name: requiredNameField,
});

export const formulaProductSchema = baseEntitySchema.extend(
	formulaProductDataSchema.shape,
);

export type FormulaProductData = z.infer<typeof formulaProductDataSchema>;
export interface FormulaProduct extends BaseEntity {
	archived?: boolean;
	costPerMl?: number;
	name: string;
}

export const formulaProductFormSchema = z.object({
	costPerMl: z.string().optional(),
	name: requiredNameField,
});

export type FormulaProductFormValues = z.infer<typeof formulaProductFormSchema>;

export const formulaProductFormToDataSchema = formulaProductFormSchema.transform(
	(values) =>
		formulaProductDataSchema.parse({
			costPerMl: optionalNumberFromInputField('Cost per ml must be a number').parse(
				values.costPerMl,
			),
			name: values.name,
		}),
);

// Feeding Products (Bottles and Teats)
export const feedingProductTypeSchema = z.enum(['bottle', 'teat']);
export type FeedingProductType = z.infer<typeof feedingProductTypeSchema>;

export const feedingProductDataSchema = z.object({
	archived: optionalBooleanCell,
	name: requiredNameField,
	type: feedingProductTypeSchema,
});

export const feedingProductSchema = baseEntitySchema.extend(
	feedingProductDataSchema.shape,
);

export type FeedingProductData = z.infer<typeof feedingProductDataSchema>;
export interface FeedingProduct extends BaseEntity {
	archived?: boolean;
	name: string;
	type: 'bottle' | 'teat';
}

export const feedingProductFormSchema = z.object({
	name: requiredNameField,
	type: feedingProductTypeSchema,
});

export type FeedingProductFormValues = z.infer<typeof feedingProductFormSchema>;

export const feedingProductFormToDataSchema = feedingProductFormSchema.transform(
	(values) =>
		feedingProductDataSchema.parse({
			name: values.name,
			type: values.type,
		}),
);
