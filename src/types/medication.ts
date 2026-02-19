import type { BaseEntity } from './base-entity';

export type MedicationRegimenType = 'fixed' | 'interval';

export interface MedicationRegimen extends BaseEntity {
	dosage: string;
	endDate?: string; // ISO string
	intervalHours?: number;
	name: string;
	prescribedBy?: string;
	startDate: string; // ISO string
	status: 'active' | 'finished';
	times?: string[]; // e.g., ["08:00", "14:00", "20:00"]
	type: MedicationRegimenType;
	unit: string;
}

export type MedicationAdministrationStatus =
	| 'administered'
	| 'missed'
	| 'skipped';

export interface MedicationAdministration extends BaseEntity {
	dosage: string;
	name: string;
	note?: string;
	prescribedBy?: string;
	regimenId?: string; // Optional for one-offs
	status: MedicationAdministrationStatus;
	timestamp: string; // ISO string
	unit: string;
}
