export interface GrowthMeasurement {
	// ISO string
	date: string;
	deviceId?: string;
	// in centimeters
	headCircumference?: number;
	// in centimeters
	height?: number;
	id: string;
	notes?: string;
	// in grams
	weight?: number;
}
