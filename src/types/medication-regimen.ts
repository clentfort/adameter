// src/types/medication-regimen.ts

/**
 * Defines a planned course or regular administration of a specific medication.
 */
export interface MedicationRegimen {
	/**
	 * The planned dosage amount for this regimen (e.g., 2.5, 500).
	 */
	dosageAmount: number;

	/**
	 * The unit of measurement for the planned dosage (e.g., "ml", "mg").
	 */
	dosageUnit: string;

	/**
	 * Optional: The date when this medication regimen is expected to end, in ISO 8601 string format.
	 * If not set, it implies an ongoing medication (e.g., daily vitamins).
	 */
	endDate?: string;

	/**
	 * Unique identifier for this medication regimen.
	 */
	id: string;

	/**
	 * Indicates if the regimen was explicitly discontinued before its planned end date.
	 * If true, the regimen is considered inactive regardless of dates.
	 */
	isDiscontinued?: boolean;

	/**
	 * The name of the medication this regimen applies to (e.g., "Vitamin D drops", "Antibiotic A").
	 */
	name: string;

	/**
	 * Optional: Any additional notes about the overall regimen (e.g., "Take with food", "Complete the full course").
	 */
	notes?: string;

	/**
	 * Who prescribed or recommended this regimen: 'Self', 'Midwife', or 'Doctor'.
	 */
	prescriber: 'Self' | 'Midwife' | 'Doctor';

	/**
	 * Optional: The specific name of the midwife or doctor who prescribed this regimen.
	 */
	prescriberName?: string;

	/**
	 * The detailed schedule for medication administration.
	 * This is crucial for automated reminders.
	 */
	schedule: MedicationSchedule;

	/**
	 * The date when this medication regimen started, in ISO 8601 string format.
	 */
	startDate: string;
}

/**
 * Defines the structured schedule for a medication regimen.
 * This union type allows for different ways to specify frequency.
 */
export type MedicationSchedule =
	| {
			times: readonly string[]; // Array of ISO time strings (e.g., "10:00", "18:30")
			type: 'daily'; // e.g., every day at a specific time
	  }
	| {
			firstDoseTime: string; // The time of the first dose after startDate (e.g., "09:00")
			intervalUnit: 'hours' | 'days'; // The unit of the interval
			intervalValue: number; // The number for the interval
			type: 'interval'; // e.g., every X hours/days
	  }
	| {
			daysOfWeek: readonly (
				| 'Monday'
				| 'Tuesday'
				| 'Wednesday'
				| 'Thursday'
				| 'Friday'
				| 'Saturday'
				| 'Sunday'
			)[];
			times: readonly string[]; // Array of ISO time strings
			type: 'weekly'; // e.g., specific days of the week at specific times
	  }
	| {
			details: string; // A description like "When fever above 38C"
			type: 'asNeeded'; // for PRN (pro re nata) medications, no automated reminders
	  };
