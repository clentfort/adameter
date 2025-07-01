// src/app/medication/utils/frecency-calculator.ts

import { MedicationAdministration } from '@/types/medication';
import { MedicationAutocompleteOptionData } from '../types/medication-autocomplete-option';

interface FrecencyEntry {
	count: number;
	dosageAmount: number;
	dosageUnit: string;
	lastTimestamp: string;
	medicationName: string;
	regimenId?: string; // Keep track if the original source was a regimen entry
}

export function calculateFrecencySuggestions(
	allAdministrations: readonly MedicationAdministration[],
): MedicationAutocompleteOptionData[] {
	const frecencyMap = new Map<string, FrecencyEntry>();

	allAdministrations.forEach((admin) => {
		// Ensure dosageAmount and dosageUnit are present, as they are mandatory.
		// medicationName is also mandatory.
		if (
			typeof admin.dosageAmount !== 'number' ||
			!admin.dosageUnit ||
			!admin.medicationName
		) {
			// This case should ideally not happen if data conforms to MedicationAdministration type
			return;
		}

		const key = `${admin.medicationName.toLowerCase()}-${admin.dosageAmount}-${admin.dosageUnit.toLowerCase()}`;

		const existingEntry = frecencyMap.get(key);

		if (existingEntry) {
			existingEntry.count += 1;
			if (new Date(admin.timestamp) > new Date(existingEntry.lastTimestamp)) {
				existingEntry.lastTimestamp = admin.timestamp;
				// If this instance is linked to a regimen, and the previous wasn't, or if this is more recent,
				// prefer regimenId from the most recent entry if it helps in tie-breaking or data consistency.
				// However, a single frecency entry represents a unique med-dose-unit, not a specific regimen instance.
				// So, we primarily care about the regimenId if ALL instances of this combo came from the SAME regimen.
				// For simplicity, we'll just update if the current one has a regimenId and is more recent.
				// This regimenId is more for informational purposes if we want to link back.
				if (admin.regimenId) {
					existingEntry.regimenId = admin.regimenId;
				}
			}
		} else {
			frecencyMap.set(key, {
				count: 1,
				dosageAmount: admin.dosageAmount,
				dosageUnit: admin.dosageUnit,
				lastTimestamp: admin.timestamp,
				medicationName: admin.medicationName,
				regimenId: admin.regimenId,
			});
		}
	});

	const suggestions: MedicationAutocompleteOptionData[] = Array.from(
		frecencyMap.values(),
	).map((entry) => ({
		dosageAmount: entry.dosageAmount,
		dosageUnit: entry.dosageUnit,
		id: `${entry.medicationName.toLowerCase()}-${entry.dosageAmount}-${entry.dosageUnit.toLowerCase()}`,
		isRegimen: false, // These are derived from administrations, so mark as not regimen *template*
		label: entry.medicationName, // Autocomplete will filter based on this
		medicationName: entry.medicationName,
		regimenId: entry.regimenId, // This will be the regimenId of the latest occurrence of this combo
		// We can store count and lastTimestamp if needed for debugging or more complex UI
		// count: entry.count,
		// lastTimestamp: entry.lastTimestamp,
	}));

	// Sort by frecency: higher count first, then more recent timestamp for ties
	suggestions.sort((a, b) => {
		// Need to access count and lastTimestamp, so we'll look them up from the map or add them to suggestions
		const entryA = frecencyMap.get(a.id)!;
		const entryB = frecencyMap.get(b.id)!;

		if (entryA.count !== entryB.count) {
			return entryB.count - entryA.count; // Higher count first
		}
		// If counts are equal, sort by recency (more recent first)
		return (
			new Date(entryB.lastTimestamp).getTime() -
			new Date(entryA.lastTimestamp).getTime()
		);
	});

	return suggestions;
}
