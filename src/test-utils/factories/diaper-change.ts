import type { DiaperChange } from '../../types/diaper';

let diaperCounter = 0;

export function createDiaperChange(
	overrides: Partial<DiaperChange> = {},
): DiaperChange {
	diaperCounter += 1;

	return {
		containsStool: false,
		containsUrine: true,
		id: `diaper-${diaperCounter}`,
		timestamp: '2024-01-01T00:00:00Z',
		...overrides,
	};
}

export function createDiaperChanges(overrides: Array<Partial<DiaperChange>>) {
	return overrides.map((override) => createDiaperChange(override));
}
