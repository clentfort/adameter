import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_SHOW_FEEDING } from '@/lib/tinybase-sync/constants';

export const useShowFeeding = () => {
	const showFeeding = useValue(STORE_VALUE_SHOW_FEEDING) as boolean | undefined;

	const setShowFeeding = useSetValueCallback(
		STORE_VALUE_SHOW_FEEDING,
		(newValue: boolean) => newValue,
		[],
	);

	return [showFeeding ?? true, setShowFeeding] as const;
};
