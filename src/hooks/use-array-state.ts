import { useCallback, useContext, useMemo } from 'react';
import { useTable } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { ROW_JSON_CELL } from '@/lib/tinybase-sync/constants';

export interface ObjectWithId {
	id: string;
}

export function useArrayState<S extends ObjectWithId>(tableId: string) {
	const { store } = useContext(tinybaseContext);
	const table = useTable(tableId, store);

	const value = useMemo(
		() =>
			Object.values(table)
				.map((row) => safeParse<S>(row[ROW_JSON_CELL]))
				.filter((item): item is S => item !== undefined),
		[table],
	);

	return {
		add: useCallback(
			(item: S) => {
				store.setRow(tableId, item.id, {
					[ROW_JSON_CELL]: JSON.stringify(item),
				});
			},
			[store, tableId],
		),
		remove: useCallback(
			(id: string) => {
				store.delRow(tableId, id);
			},
			[store, tableId],
		),
		replace: useCallback(
			(next: S[]) => {
				const nextTable = Object.fromEntries(
					next.map((item) => [
						item.id,
						{ [ROW_JSON_CELL]: JSON.stringify(item) },
					]),
				);
				store.setTable(tableId, nextTable);
			},
			[store, tableId],
		),
		update: useCallback(
			(item: S) => {
				store.setRow(tableId, item.id, {
					[ROW_JSON_CELL]: JSON.stringify(item),
				});
			},
			[store, tableId],
		),
		value,
	} as const;
}

function safeParse<T>(value: unknown): T | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	try {
		return JSON.parse(value) as T;
	} catch {
		return undefined;
	}
}
