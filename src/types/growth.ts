import type { BaseEntity } from './base-entity';

export interface GrowthMeasurement extends BaseEntity {
	// ISO string
	date: string;
	// in centimeters
	headCircumference?: number;
	// in centimeters
	height?: number;
	notes?: string;
	// in grams
	weight?: number;
}
