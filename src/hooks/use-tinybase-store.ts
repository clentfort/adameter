import type { MergeableStore } from 'tinybase';
import { useStore } from 'tinybase/ui-react';

export function useTinybaseStore(): MergeableStore {
	return useStore() as MergeableStore;
}
