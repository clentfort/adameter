import { useMemo } from 'react';
import { DiaperChange } from '@/types/diaper';
import { useDiaperChanges } from './use-diaper-changes';

export function useLatestDiaperChange(): DiaperChange | undefined {
	const { value: diaperChanges } = useDiaperChanges();

	return useMemo(() => {
		if (!diaperChanges || diaperChanges.length === 0) {
			return undefined;
		}

		// Sort by timestamp in descending order and take the first element
		// Timestamps are ISO strings, so string comparison works for finding the latest.
		return [...diaperChanges].sort((a, b) => {
			if (a.timestamp < b.timestamp) {
				return 1;
			}
			if (a.timestamp > b.timestamp) {
				return -1;
			}
			return 0;
		})[0];
	}, [diaperChanges]);
}
