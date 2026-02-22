import type { DiaperChange } from '@/types/diaper';

export function migrateDiaperChanges(changes: DiaperChange[]): {
	hasChanges: boolean;
	migrated: DiaperChange[];
} {
	let hasChanges = false;
	const migrated = changes.map((change) => {
		if (change.pottyUrine !== undefined && change.pottyStool !== undefined) {
			return change;
		}

		const notes = change.abnormalities?.toLowerCase() || '';
		const newChange: DiaperChange = {
			...change,
			pottyStool: change.pottyStool ?? false,
			pottyUrine: change.pottyUrine ?? false,
		};

		if (notes.includes('urin abgehalten')) {
			newChange.pottyUrine = true;
		}
		if (notes.includes('stuhl abgehalten')) {
			newChange.pottyStool = true;
		}
		if (notes.includes('windel trocken')) {
			newChange.containsUrine = false;
			newChange.containsStool = false;
		}

		hasChanges = true;
		return newChange;
	});

	return { hasChanges, migrated };
}
