import { useStore } from 'tinybase/ui-react';

export function useTinybaseStore() {
	return useStore()!;
}
