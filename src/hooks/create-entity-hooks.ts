import type { Row } from 'tinybase';
import { useMemo } from 'react';
import {
	useDelRowCallback,
	useRow,
	useRowIds,
	useSetRowCallback,
	useStore,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';
import { useSelectedProfileId } from './use-selected-profile-id';

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
		const [selectedProfileId] = useSelectedProfileId();
		return useSetRowCallback<T>(
			tableId,
			(entity) => entity.id,
			(entity) => {
				const cells = sanitize(entity);
				if (!cells) return {};

				const result: Record<string, unknown> = {
					...cells,
					deviceId: getDeviceId(),
				};

				if (tableId !== TABLE_IDS.PROFILES && selectedProfileId) {
					result.profileId = selectedProfileId;
				}

				return result;
			},
			[selectedProfileId],
		);
	}

	function useRemove() {
		return useDelRowCallback<string>(tableId, (id) => id);
	}

	function useOne(entityId: string | undefined) {
		const store = useStore()!;
		const row = useRow(tableId, entityId ?? '', store);
		const [selectedProfileId] = useSelectedProfileId();

		return useMemo(() => {
			if (!entityId || Object.keys(row).length === 0) {
				return undefined;
			}

			if (
				tableId !== TABLE_IDS.PROFILES &&
				selectedProfileId &&
				row.profileId !== selectedProfileId
			) {
				return undefined;
			}

			return toEntity(entityId, row) ?? undefined;
		}, [entityId, row, selectedProfileId]);
	}

	function useSnapshot() {
		const store = useStore()!;
		const table = useTable(tableId, store);
		const [selectedProfileId] = useSelectedProfileId();

		return useMemo(
			() =>
				Object.entries(table)
					.filter(([, row]) => {
						if (tableId === TABLE_IDS.PROFILES) {
							return true;
						}
						return !selectedProfileId || row.profileId === selectedProfileId;
					})
					.map(([id, row]) => toEntity(id, row))
					.filter((entity): entity is T => entity !== null),
			[table, selectedProfileId],
		);
	}

	function useIds() {
		const store = useStore()!;
		const [selectedProfileId] = useSelectedProfileId();
		const allIds = useRowIds(tableId, store);
		const table = useTable(tableId, store);

		return useMemo(() => {
			if (tableId === TABLE_IDS.PROFILES || !selectedProfileId) {
				return allIds;
			}

			return allIds.filter((id) => table[id]?.profileId === selectedProfileId);
		}, [allIds, selectedProfileId, table]);
	}

	return {
		useIds,
		useOne,
		useRemove,
		useSnapshot,
		useUpsert,
	};
}
