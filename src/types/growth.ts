export interface GrowthMeasurement {
	date: string;
	// in grams
	height?: number;
	// in centimeters
	headCircumference?: number;
	id: string;
	// in centimeters
	notes?: string;
	// ISO string
	weight?: number;
}
