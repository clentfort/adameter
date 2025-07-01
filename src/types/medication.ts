// src/types/medication.ts

/**
 * Represents a single instance of medication administered to the child.
 * This entry typically logs an administration that is part of a MedicationRegimen.
 */
export interface Medication {
	/**
	 * Indicates if this administration was given as planned ('On Time'),
	 * if it was missed ('Missed'), or given at a different time/dosage ('Adjusted').
	 */
	administrationStatus: 'On Time' | 'Missed' | 'Adjusted';

	/**
	 * Optional: Specific notes for this particular administration (e.g., "Child spit out half", "Given late").
	 * This is separate from the general notes on the regimen.
	 */
	details?: string;

	/**
	 * The actual dosage amount given for this specific administration.
	 * This might differ from the regimen's planned dosage (e.g., if a partial dose was given).
	 */
	dosageAmount: number;

	/**
	 * Unique identifier for this individual medication administration.
	 */
	id: string;

	/**
	 * The ID of the MedicationRegimen this administration belongs to.
	 * This links the individual log to its broader plan and allows inheriting properties like dosage unit.
	 */
	regimenId: string;

	/**
	 * The exact date and time the medication was given, in ISO 8601 string format.
	 */
	timestamp: string;
}
