import type { Row, Table } from 'tinybase';
import { useCallback, useContext, useMemo } from 'react';
import { useTableState } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { ROW_JSON_CELL, ROW_ORDER_CELL } from '@/lib/tinybase-sync/constants';

export interface ObjectWithId {
	id: string;
}

export function useTableArrayState<S extends ObjectWithId>(tableId: string) {
	const { store } = useContext(tinybaseContext);
	const [table, setTable] = useTableState(tableId, store);

	const value = useMemo(() => tableToArray<S>(table), [table]);

	const add = useCallback(
		(item: S) => {
			const nextTable: Table = {
				...table,
				[item.id]: {
					[ROW_JSON_CELL]: JSON.stringify(item),
					[ROW_ORDER_CELL]: getNextOrder(table),
				},
			};

			setTable(nextTable);
		},
		[setTable, table],
	);

	const remove = useCallback(
		(id: string) => {
			if (!(id in table)) {
				return;
			}

			const { [id]: _removed, ...nextTable } = table;
			setTable(nextTable as Table);
		},
		[setTable, table],
	);

	const replace = useCallback(
		(next: S[]) => {
			setTable(arrayToTable(next));
		},
		[setTable],
	);

	const update = useCallback(
		(nextItem: S) => {
			const existingRow = table[nextItem.id];
			if (!existingRow) {
				return;
			}

			const existingOrder = existingRow[ROW_ORDER_CELL];
			const nextTable: Table = {
				...table,
				[nextItem.id]: {
					[ROW_JSON_CELL]: JSON.stringify(nextItem),
					[ROW_ORDER_CELL]:
						typeof existingOrder === 'number'
							? existingOrder
							: getNextOrder(table),
				},
			};

			setTable(nextTable);
		},
		[setTable, table],
	);

	return {
		add,
		remove,
		replace,
		update,
		value,
	} as const;
}

function arrayToTable<S extends ObjectWithId>(items: S[]): Table {
	const table: Table = {};
	for (const [order, item] of items.entries()) {
		table[item.id] = {
			[ROW_JSON_CELL]: JSON.stringify(item),
			[ROW_ORDER_CELL]: order,
		};
	}

	return table;
}

function tableToArray<S extends ObjectWithId>(table: Table): S[] {
	return Object.entries(table)
		.map(([rowId, row]) => {
			const jsonCell = row[ROW_JSON_CELL];
			if (typeof jsonCell !== 'string') {
				return undefined;
			}

			const parsed = safeParse<S>(jsonCell);
			if (!parsed || typeof parsed.id !== 'string') {
				return undefined;
			}

			const orderCell = row[ROW_ORDER_CELL];
			const order =
				typeof orderCell === 'number' ? orderCell : Number.MAX_SAFE_INTEGER;

			return {
				item: parsed,
				order,
				rowId,
			};
		})
		.filter(
			(entry): entry is { item: S; order: number; rowId: string } =>
				entry !== undefined,
		)
		.sort((left, right) => {
			if (left.order !== right.order) {
				return left.order - right.order;
			}

			return left.rowId.localeCompare(right.rowId);
		})
		.map((entry) => entry.item);
}

function getNextOrder(table: Table) {
	let maxOrder = -1;
	for (const row of Object.values(table)) {
		const orderCell = (row as Row)[ROW_ORDER_CELL];
		if (typeof orderCell === 'number' && orderCell > maxOrder) {
			maxOrder = orderCell;
		}
	}

	return maxOrder + 1;
}

function safeParse<T>(value: string): T | undefined {
	try {
		return JSON.parse(value) as T;
	} catch {
		return undefined;
	}
}
