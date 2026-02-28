import type { Profile } from '@/types/profile';
import { useMemo } from 'react';
import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_PROFILE } from '@/lib/tinybase-sync/constants';

export const useProfile = () => {
	const currentJson = useValue(STORE_VALUE_PROFILE);
	const current = useMemo(() => parseProfile(currentJson), [currentJson]);

	const set = useSetValueCallback(
		STORE_VALUE_PROFILE,
		(nextProfile: Profile | null) => {
			if (nextProfile === null) {
				return undefined;
			}

			const normalized = structuredClone(nextProfile);
			return JSON.stringify(normalized);
		},
		[],
	);

	return [current, set] as const;
};

function parseProfile(value: unknown): Profile | null {
	if (typeof value !== 'string') {
		return null;
	}

	try {
		return JSON.parse(value) as Profile;
	} catch {
		return null;
	}
}
