import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_SHOW_FEEDING } from '@/lib/tinybase-sync/constants';

export const useShowFeeding = () => {
	const showFeeding = useValue(STORE_VALUE_SHOW_FEEDING) as boolean | undefined;

	// Handling default value at the hook level to ensure a stable state
	// without interfering with synchronization or overwriting user preferences
	// via migrations.
	const effectiveShowFeeding = showFeeding ?? true;

	const setShowFeeding = useSetValueCallback(
		STORE_VALUE_SHOW_FEEDING,
		(newValue: boolean) => newValue,
		[],
	);

	return [effectiveShowFeeding, setShowFeeding] as const;
};
