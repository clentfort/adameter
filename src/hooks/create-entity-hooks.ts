import type { Row } from 'tinybase';
import { useMemo } from 'react';
import {
	useDelRowCallback,
	useRow,
	useRowIds,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { useTinybaseStore } from '@/hooks/use-tinybase-store';
import { getDeviceId } from '@/utils/device-id';

interface EntityHooksConfig<T extends { id: string }> {
	sanitize: (entity: T) => Record<string, unknown> | null;
	tableId: string;
	toEntity: (id: string, row: Row) => T | null;
}

export function createEntityHooks<T extends { id: string }>(
	config: EntityHooksConfig<T>,
) {
	const { sanitize, tableId, toEntity } = config;

	function useUpsert() {
		return useSetRowCallback<T>(
			tableId,
			(entity) => entity.id,
			(entity) => {
				const cells = sanitize(entity);
				return cells ? { ...cells, deviceId: getDeviceId() } : {};
			},
			[],
		);
	}

	function useRemove() {
		return useDelRowCallback<string>(tableId, (id) => id);
	}

	function useOne(entityId: string | undefined) {
		const store = useTinybaseStore();
		const row = useRow(tableId, entityId ?? '', store);

		return useMemo(() => {
			if (!entityId || Object.keys(row).length === 0) {
				return undefined;
			}

			return toEntity(entityId, row) ?? undefined;
		}, [entityId, row]);
	}

	function useSnapshot() {
		const store = useTinybaseStore();
		const table = useTable(tableId, store);

		return useMemo(
			() =>
				Object.entries(table)
					.map(([id, row]) => toEntity(id, row))
					.filter((entity): entity is T => entity !== null),
			[table],
		);
	}

	function useIds() {
		const store = useTinybaseStore();
		return useRowIds(tableId, store);
	}

	return {
		useIds,
		useOne,
		useRemove,
		useSnapshot,
		useUpsert,
	};
}
