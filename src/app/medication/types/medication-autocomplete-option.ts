// src/app/medication/types/medication-autocomplete-option.ts

export interface MedicationAutocompleteOptionData {
	dosageAmount: number;
	dosageUnit: string;
	id: string; // Unique identifier for the option (e.g., "medicationName-dosageAmount-dosageUnit" or "regimen-id")
	isRegimen?: boolean; // To differentiate regimen options for rendering or logic
	label: string; // Text to be displayed and filtered against (typically medicationName)
	medicationName: string;
	regimenId?: string; // Optional, if the suggestion comes from a regimen
}
