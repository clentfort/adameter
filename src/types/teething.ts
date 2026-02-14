import type { BaseEntity } from './base-entity';

export interface Tooth extends BaseEntity {
	date?: string; // ISO date of eruption
	notes?: string;
	toothId: number; // FDI number
}
