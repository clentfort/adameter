import type { Cell, Row } from 'tinybase';
import type { ZodType } from 'zod';
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

function isInSelectedProfile(
	tableId: string,
	row: Row | undefined,
	selectedProfileId: string | undefined,
): boolean {
	return (
		tableId === TABLE_IDS.PROFILES ||
		!selectedProfileId ||
		row?.profileId === selectedProfileId
	);
}

export function createRowParser<T>(
	schema: ZodType<T>,
	label: string,
): (id: string, row: Row) => T | null {
	return (id: string, row: Row): T | null => {
		const result = schema.safeParse({
			...row,
			id,
		});

		if (!result.success) {
			// eslint-disable-next-line no-console
			console.warn(`Invalid ${label} data for id ${id}:`, result.error.issues);
			return null;
		}

		return result.data;
	};
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
				if (!cells) return {} as Row;

				const result: Record<string, Cell> = {
					...(cells as Record<string, Cell>),
					deviceId: getDeviceId() as Cell,
				};

				if (tableId !== TABLE_IDS.PROFILES && selectedProfileId) {
					result.profileId = selectedProfileId as Cell;
				}

				return result as Row;
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

			if (!isInSelectedProfile(tableId, row, selectedProfileId)) {
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
					.filter(([, row]) =>
						isInSelectedProfile(tableId, row, selectedProfileId),
					)
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
			return allIds.filter((id) =>
				isInSelectedProfile(tableId, table[id], selectedProfileId),
			);
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
