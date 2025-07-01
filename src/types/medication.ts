// src/types/medication.ts

/**
 * Represents a single instance of medication administered to the child.
 * This can be linked to a MedicationRegimen or be a one-off administration.
 */
export interface MedicationAdministration {
	/**
	 * Indicates if this administration was given as planned ('On Time'),
	 * if it was missed ('Missed'), or given at a different time/dosage ('Adjusted').
	 * For one-off administrations, 'On Time' would typically be used.
	 */
	administrationStatus: 'On Time' | 'Missed' | 'Adjusted';

	/**
	 * Optional: Specific notes for this particular administration (e.g., "Child spit out half", "Given late").
	 */
	details?: string;

	/**
	 * The actual dosage amount given for this specific administration.
	 */
	dosageAmount: number;

	/**
	 * The unit for the dosageAmount (e.g., "ml", "mg", "drops").
	 * If linked to a regimen, this is copied from the regimen at the time of administration.
	 */
	dosageUnit: string;

	/**
	 * Unique identifier for this individual medication administration.
	 */
	id: string;

	/**
	 * The name of the medication administered.
	 * If linked to a regimen, this is copied from the regimen at the time of administration.
	 */
	medicationName: string;

	/**
	 * Optional: The ID of the MedicationRegimen this administration belongs to.
	 * If undefined, this administration is a one-off event not tied to a specific regimen.
	 */
	regimenId?: string;

	/**
	 * The exact date and time the medication was given, in ISO 8601 string format.
	 */
	timestamp: string;
}
