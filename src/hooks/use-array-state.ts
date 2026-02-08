import type { Store } from 'tinybase';
import { useCallback, useContext, useEffect, useState } from 'react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { startPerformanceTimer } from '@/lib/performance-logging';
import { ROW_JSON_CELL, ROW_ORDER_CELL } from '@/lib/tinybase-sync/constants';

export interface ObjectWithId {
	id: string;
}

export function useArrayState<S extends ObjectWithId>(tableId: string) {
	const { store } = useContext(tinybaseContext);
	const [value, setValue] = useState<S[]>(() =>
		readArrayFromStoreTable<S>(store, tableId),
	);

	useEffect(() => {
		setValue(readArrayFromStoreTable<S>(store, tableId));
		const listenerId = store.addTableListener(tableId, () => {
			setValue(readArrayFromStoreTable<S>(store, tableId));
		});

		return () => {
			store.delListener(listenerId);
		};
	}, [store, tableId]);

	return {
		add: useCallback(
			(item: S) => {
				const timer = startPerformanceTimer('state.array.add', {
					itemCountBefore: store.getRowCount(tableId),
				});

				const normalized = normalize(item);
				store.setRow(tableId, normalized.id, {
					[ROW_JSON_CELL]: JSON.stringify(normalized),
					[ROW_ORDER_CELL]: getNextOrder(store, tableId),
				});

				timer.end({
					metadata: {
						itemCountAfter: store.getRowCount(tableId),
					},
				});
			},
			[store, tableId],
		),
		remove: useCallback(
			(id: string) => {
				const timer = startPerformanceTimer('state.array.remove', {
					itemCountBefore: store.getRowCount(tableId),
				});

				if (!store.hasRow(tableId, id)) {
					timer.end({
						metadata: {
							itemCountAfter: store.getRowCount(tableId),
							removed: false,
						},
					});
					return;
				}

				store.delRow(tableId, id);
				timer.end({
					metadata: {
						itemCountAfter: store.getRowCount(tableId),
						removed: true,
					},
				});
			},
			[store, tableId],
		),
		replace: useCallback(
			(next: S[]) => {
				const timer = startPerformanceTimer('state.array.replace', {
					incomingItemCount: next.length,
					itemCountBefore: store.getRowCount(tableId),
				});

				const normalized = next.map((item) => normalize(item));
				store.transaction(() => {
					for (const rowId of store.getRowIds(tableId)) {
						store.delRow(tableId, rowId);
					}

					for (const [order, item] of normalized.entries()) {
						store.setRow(tableId, item.id, {
							[ROW_JSON_CELL]: JSON.stringify(item),
							[ROW_ORDER_CELL]: order,
						});
					}
				});

				timer.end({
					metadata: {
						itemCountAfter: store.getRowCount(tableId),
					},
				});
			},
			[store, tableId],
		),
		update: useCallback(
			(update: S) => {
				const timer = startPerformanceTimer('state.array.update', {
					itemCountBefore: store.getRowCount(tableId),
				});

				if (!store.hasRow(tableId, update.id)) {
					timer.end({
						metadata: {
							itemCountAfter: store.getRowCount(tableId),
							updated: false,
						},
					});
					return;
				}

				const normalized = normalize(update);
				const orderCell = store.getCell(tableId, update.id, ROW_ORDER_CELL);
				const order =
					typeof orderCell === 'number'
						? orderCell
						: getNextOrder(store, tableId);

				store.setRow(tableId, update.id, {
					[ROW_JSON_CELL]: JSON.stringify(normalized),
					[ROW_ORDER_CELL]: order,
				});

				timer.end({
					metadata: {
						itemCountAfter: store.getRowCount(tableId),
						updated: true,
					},
				});
			},
			[store, tableId],
		),
		value,
	} as const;
}

function readArrayFromStoreTable<S extends ObjectWithId>(
	store: Store,
	tableId: string,
) {
	return store
		.getRowIds(tableId)
		.map((rowId: string) => {
			const jsonCell = store.getCell(tableId, rowId, ROW_JSON_CELL);
			if (typeof jsonCell !== 'string') {
				return undefined;
			}

			const parsed = safeParse<S>(jsonCell);
			if (!parsed || typeof parsed.id !== 'string') {
				return undefined;
			}

			const orderCell = store.getCell(tableId, rowId, ROW_ORDER_CELL);
			const order =
				typeof orderCell === 'number' ? orderCell : Number.MAX_SAFE_INTEGER;

			return {
				item: normalize(parsed),
				order,
				rowId,
			};
		})
		.filter(
			(
				entry: { item: S; order: number; rowId: string } | undefined,
			): entry is { item: S; order: number; rowId: string } =>
				entry !== undefined,
		)
		.sort(
			(
				left: { item: S; order: number; rowId: string },
				right: { item: S; order: number; rowId: string },
			) => {
				if (left.order !== right.order) {
					return left.order - right.order;
				}

				return left.rowId.localeCompare(right.rowId);
			},
		)
		.map((entry: { item: S; order: number; rowId: string }) => entry.item);
}

function getNextOrder(store: Store, tableId: string) {
	let maxOrder = -1;
	for (const rowId of store.getRowIds(tableId)) {
		const orderCell = store.getCell(tableId, rowId, ROW_ORDER_CELL);
		if (typeof orderCell === 'number' && orderCell > maxOrder) {
			maxOrder = orderCell;
		}
	}

	return maxOrder + 1;
}

function normalize<T extends ObjectWithId>(item: T): T {
	return JSON.parse(JSON.stringify(item)) as T;
}

function safeParse<T>(value: string): T | undefined {
	try {
		return JSON.parse(value) as T;
	} catch {
		return undefined;
	}
}
