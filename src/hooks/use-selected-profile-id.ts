import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_SELECTED_PROFILE_ID } from '@/lib/tinybase-sync/constants';

export const useSelectedProfileId = () => {
	const selectedProfileId = useValue(STORE_VALUE_SELECTED_PROFILE_ID) as
		| string
		| undefined;

	const setSelectedProfileId = useSetValueCallback(
		STORE_VALUE_SELECTED_PROFILE_ID,
		(id: string) => id,
		[],
	);

	return [selectedProfileId, setSelectedProfileId] as const;
};
