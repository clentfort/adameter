import type { DiaperChange } from '@/types/diaper';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperChanges = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_CHANGES, store);

	const value = useMemo(() => fromTable<DiaperChange>(table), [table]);

	const add = useCallback(
		(item: DiaperChange) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.DIAPER_CHANGES, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: DiaperChange) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.DIAPER_CHANGES, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.DIAPER_CHANGES, id);
		},
		[store],
	);

	return {
		add,
		remove,
		update,
		value,
	} as const;
};
