export interface DiaperChange {
	// Optional leakage indicator
	abnormalities?: string;
	containsStool: boolean; // ISO string
	containsUrine: boolean;
	// Optional temperature in Celsius
	diaperBrand?: string;
	id: string;
	// Optional diaper brand
	leakage?: boolean;
	temperature?: number;
	timestamp: string; // Optional notes about abnormalities
}
