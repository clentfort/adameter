import { useCallback } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';

export interface ObjectWithId {
	id: string;
}

export function useArrayState<S extends ObjectWithId>(table: string) {
	const value = useTable(table);
	const store = useStore();

	return {
		add: useCallback(
			(item: S) => {
				if (store) {
					store.setRow(table, item.id, item);
				}
			},
			[store, table],
		),
		remove: useCallback(
			(id: string) => {
				if (store) {
					store.delRow(table, id);
				}
			},
			[store, table],
		),
		replace: () => {},
		update: useCallback(
			(item: S) => {
				if (store) {
					store.setRow(table, item.id, item);
				}
			},
			[store, table],
		),
		value: Object.values(value) as unknown as S[],
	} as const;
}
