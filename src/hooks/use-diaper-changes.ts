import type { Row } from 'tinybase';
import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import {
	useDelRowCallback,
	useRow,
	useSetRowCallback,
	useStore,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperChangeForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { getDeviceId } from '@/utils/device-id';

function toDiaperChange(id: string, row: Row): DiaperChange {
	return {
		...row,
		id,
	} as DiaperChange;
}

interface DiaperChangeListEntry {
	id: string;
	timestamp: string;
}

export function useUpsertDiaperChange() {
	return useSetRowCallback<DiaperChange>(
		TABLE_IDS.DIAPER_CHANGES,
		(change) => change.id,
		(change) => {
			const cells = sanitizeDiaperChangeForStore(change);
			return cells ? { ...cells, deviceId: getDeviceId() } : {};
		},
		[],
	);
}

export function useRemoveDiaperChange() {
	return useDelRowCallback<string>(TABLE_IDS.DIAPER_CHANGES, (id) => id);
}

export function useDiaperChange(changeId: string | undefined) {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.DIAPER_CHANGES, changeId ?? '', store);

	return useMemo(() => {
		if (!changeId || Object.keys(row).length === 0) {
			return undefined;
		}

		return toDiaperChange(changeId, row);
	}, [changeId, row]);
}

export function useDiaperChangesSnapshot() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_CHANGES, store);

	return useMemo(
		() =>
			Object.entries(table).map(([changeId, row]) =>
				toDiaperChange(changeId, row),
			),
		[table],
	);
}

export function useLatestDiaperChangeRecord() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_CHANGES, store);

	return useMemo(() => {
		let latestChange: DiaperChange | undefined;

		for (const [changeId, row] of Object.entries(table)) {
			const change = toDiaperChange(changeId, row);
			if (!latestChange || change.timestamp > latestChange.timestamp) {
				latestChange = change;
			}
		}

		return latestChange;
	}, [table]);
}
