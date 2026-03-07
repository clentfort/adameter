import type { Row } from 'tinybase';
import type { Tooth } from '@/types/teething';
import { useMemo } from 'react';
import {
	useRow,
	useSetRowCallback,
	useStore,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeToothForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { getDeviceId } from '@/utils/device-id';

function toTooth(id: string, row: Row): Tooth {
	return {
		...row,
		id,
	} as Tooth;
}

export function useUpsertTooth() {
	return useSetRowCallback<Tooth>(
		TABLE_IDS.TEETHING,
		(tooth) => tooth.id,
		(tooth) => {
			const cells = sanitizeToothForStore(tooth);
			return cells ? { ...cells, deviceId: getDeviceId() } : {};
		},
		[],
	);
}

export function useTooth(toothId: string | undefined) {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.TEETHING, toothId ?? '', store);

	return useMemo(() => {
		if (!toothId || Object.keys(row).length === 0) {
			return undefined;
		}

		return toTooth(toothId, row);
	}, [row, toothId]);
}

export function useTeethSnapshot() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.TEETHING, store);

	return useMemo(
		() => Object.entries(table).map(([toothId, row]) => toTooth(toothId, row)),
		[table],
	);
}
