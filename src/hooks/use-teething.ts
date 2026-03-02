import type { Tooth } from '@/types/teething';
import { useCallback, useMemo } from 'react';
import { useRow, useRowIds, useStore } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useToothRow = (id: string) => {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.TEETHING, id, store);
	return useMemo(() => ({ ...row, id }) as unknown as Tooth, [id, row]);
};

export const useTeething = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.TEETHING, store);

	const add = useCallback(
		(item: Tooth) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.TEETHING, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: Tooth) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.TEETHING, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.TEETHING, id);
		},
		[store],
	);

	return {
		add,
		remove,
		rowIds,
		update,
	} as const;
};
