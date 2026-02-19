import type { Profile } from '@/types/profile';
import { useCallback, useContext, useMemo } from 'react';
import { useValue } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { STORE_VALUE_PROFILE } from '@/lib/tinybase-sync/constants';

export const useProfile = () => {
	const { store } = useContext(tinybaseContext);
	const currentJson = useValue(STORE_VALUE_PROFILE, store);
	const current = useMemo(() => parseProfile(currentJson), [currentJson]);

	const set = useCallback(
		(nextProfile: Profile | null) => {
			if (nextProfile === null) {
				store.delValue(STORE_VALUE_PROFILE);
				return;
			}

			const normalized = structuredClone(nextProfile);
			store.setValue(STORE_VALUE_PROFILE, JSON.stringify(normalized));
		},
		[store],
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
