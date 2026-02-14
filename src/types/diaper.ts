import type { BaseEntity } from './base-entity';

export interface DiaperChange extends BaseEntity {
	/** Optional notes about abnormalities, displayed as "Notes" in the UI. */
	abnormalities?: string;
	/** Whether the diaper contains stool. ISO string. */
	containsStool: boolean;
	/** Whether the diaper contains urine. */
	containsUrine: boolean;
	/** Optional diaper brand. */
	diaperBrand?: string;
	/** Optional leakage indicator. */
	leakage?: boolean;
	/** Optional temperature in Celsius. */
	temperature?: number;
	/** Timestamp of the diaper change. */
	timestamp: string;
}
