import type { DiaperChange } from '@/types/diaper';

export function migrateDiaperChange(change: DiaperChange): DiaperChange {
	if (change.pottyUrine !== undefined && change.pottyStool !== undefined) {
		return change;
	}

	const notes = change.abnormalities?.toLowerCase() || '';
	const newChange: DiaperChange = {
		...change,
		pottyStool: change.pottyStool ?? false,
		pottyUrine: change.pottyUrine ?? false,
	};

	let hasChanges = false;

	if (notes.includes('urin abgehalten') || notes.includes('beides abgehalten')) {
		newChange.pottyUrine = true;
		hasChanges = true;
	}
	if (notes.includes('stuhl abgehalten') || notes.includes('beides abgehalten')) {
		newChange.pottyStool = true;
		hasChanges = true;
	}
	if (notes.includes('windel trocken')) {
		newChange.containsUrine = false;
		newChange.containsStool = false;
		hasChanges = true;
	}

	return hasChanges ? newChange : change;
}

export function migrateDiaperChanges(changes: DiaperChange[]): {
	hasChanges: boolean;
	migrated: DiaperChange[];
} {
	let hasGlobalChanges = false;
	const migrated = changes.map((change) => {
		const migratedChange = migrateDiaperChange(change);
		if (migratedChange !== change) {
			hasGlobalChanges = true;
		}
		return migratedChange;
	});

	return { hasChanges: hasGlobalChanges, migrated };
}
