import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';
import { getDeviceId } from '@/utils/device-id';

type CellValue = boolean | number | string;
type SanitizedRow = Record<string, CellValue>;

export function useTinybaseEntityTable<TEntity>(
	tableId: string,
	sanitizeEntity: (entity: TEntity) => SanitizedRow | null,
) {
	const store = useStore()!;
	const table = useTable(tableId, store);

	const value = useMemo(() => fromTable<TEntity>(table), [table]);

	const writeEntity = useCallback(
		(entity: TEntity & { id: string }) => {
			const cells = sanitizeEntity(entity);
			if (!cells) {
				return;
			}

			store.setRow(tableId, entity.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[sanitizeEntity, store, tableId],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(tableId, id);
		},
		[store, tableId],
	);

	return {
		add: writeEntity,
		remove,
		update: writeEntity,
		value,
	} as const;
}
