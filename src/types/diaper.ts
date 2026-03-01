import type { BaseEntity } from './base-entity';
import { z } from 'zod';

export const diaperFormSchema = z.object({
	containsStool: z.boolean(),
	containsUrine: z.boolean(),
	date: z.string().min(1),
	diaperProductId: z.string().optional(),
	leakage: z.boolean(),
	notes: z.string().optional(),
	pottyStool: z.boolean(),
	pottyUrine: z.boolean(),
	temperature: z
		.string()
		.optional()
		.refine(
			(value) =>
				value === undefined ||
				value.length === 0 ||
				!Number.isNaN(Number(value)),
			{
				message: 'Temperature must be a number',
			},
		),
	time: z.string().min(1),
});

export type DiaperFormValues = z.infer<typeof diaperFormSchema>;

export const diaperProductSchema = z.object({
	costPerDiaper: z
		.string()
		.optional()
		.refine(
			(value) =>
				value === undefined ||
				value.length === 0 ||
				!Number.isNaN(Number(value)),
			{
				message: 'Cost per diaper must be a number',
			},
		),
	isReusable: z.boolean(),
	name: z.string().min(1),
});

export type DiaperProductFormValues = z.infer<typeof diaperProductSchema>;

export interface DiaperProduct extends BaseEntity {
	/** Whether the product is archived. */
	archived?: boolean;
	/** Cost per diaper in the current currency. */
	costPerDiaper?: number;
	/** Whether the diaper is reusable. */
	isReusable: boolean;
	/** Name of the diaper product. */
	name: string;
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
	/** Optional user-entered notes shown in the diaper UI. */
	notes?: string;
	/** Whether stool went into the potty. */
	pottyStool?: boolean;
	/** Whether urine went into the potty. */
	pottyUrine?: boolean;
	/** Optional temperature in Celsius. */
	temperature?: number;
	/** Timestamp of the diaper change. */
	timestamp: string;
}
