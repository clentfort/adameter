export interface DiaperChange {
	/** Optional notes about abnormalities, displayed as "Notes" in the UI. */
	abnormalities?: string;
	/** Whether the diaper contains stool. ISO string. */
	containsStool: boolean;
	/** Whether the diaper contains urine. */
	containsUrine: boolean;
	/** Optional diaper brand. */
	diaperBrand?: string;
	/** Unique identifier for the diaper change. */
	id: string;
	/** Optional leakage indicator. */
	leakage?: boolean;
	/** Optional temperature in Celsius. */
	temperature?: number;
	/** Timestamp of the diaper change. */
	timestamp: string;
}
