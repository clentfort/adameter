import { useMemo } from 'react';
import { DiaperChange } from '@/types/diaper';
import { useDiaperChanges } from './use-diaper-changes';

export function useLatestDiaperChange(): DiaperChange | undefined {
	const { value: diaperChanges } = useDiaperChanges();

	return useMemo(() => {
		const start =
			typeof performance !== 'undefined' ? performance.now() : Date.now();

		if (!diaperChanges || diaperChanges.length === 0) {
			return undefined;
		}

		let latestChange = diaperChanges[0];
		for (let index = 1; index < diaperChanges.length; index += 1) {
			const diaperChange = diaperChanges[index];
			if (diaperChange.timestamp > latestChange.timestamp) {
				latestChange = diaperChange;
			}
		}

		return latestChange;
	}, [diaperChanges]);
}
