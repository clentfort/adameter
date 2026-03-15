import { useSetValueCallback, useValue } from "tinybase/ui-react";
import { } from '@/hooks/use-tinybase-store';
import { STORE_VALUE_DEV_MODE } from '@/lib/tinybase-sync/constants';

export const useDevMode = () => {
	const devMode = useValue(STORE_VALUE_DEV_MODE) as boolean | undefined;

	const setDevMode = useSetValueCallback(
		STORE_VALUE_DEV_MODE,
		(newDevMode: boolean) => newDevMode,
		[],
	);

	return [devMode ?? false, setDevMode] as const;
};
