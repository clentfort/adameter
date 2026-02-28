import { z } from 'zod';
import type { BaseEntity } from './base-entity';

export const diaperSchema = z.object({
	abnormalities: z.string().optional(),
	containsStool: z.boolean(),
	containsUrine: z.boolean(),
	date: z.string().min(1),
	diaperProductId: z.string().optional(),
	leakage: z.boolean(),
	pottyStool: z.boolean(),
	pottyUrine: z.boolean(),
	temperature: z.string().optional(),
	time: z.string().min(1),
});

export type DiaperFormValues = z.infer<typeof diaperSchema>;

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
	/** Optional notes about abnormalities, displayed as "Notes" in the UI. */
	abnormalities?: string;
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
